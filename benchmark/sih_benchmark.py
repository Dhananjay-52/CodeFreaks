#!/usr/bin/env python3
"""
SIH Sovereign AI Workbench - Local LLM / Hardware Benchmark
============================================================

Purpose:
  Collect REAL hardware/runtime data for the prototype benchmark report.

Scope:
  - GPU model, VRAM, driver and CUDA information
  - CPU, RAM, OS
  - Ollama version and installed models
  - Local model cold/warm response timing
  - Time to first token (streaming)
  - Generation speed (tokens/sec)
  - Approximate GPU memory delta during each run
  - JSON + CSV result files

Requirements:
  - Python 3.9+
  - Ollama running locally
  - At least one model already pulled in Ollama
  - NVIDIA driver + nvidia-smi for GPU measurements
  - Optional: psutil (recommended): pip install psutil

Examples:
  python sih_benchmark.py
  python sih_benchmark.py --models qwen2.5:3b,gemma3:4b
  python sih_benchmark.py --runs 3
"""

import argparse
import csv
import datetime as dt
import json
import os
import platform
import shutil
import subprocess
import sys
import time
import urllib.request
import urllib.error

try:
    import psutil
except ImportError:
    psutil = None

OLLAMA_URL = "http://127.0.0.1:11434"

PROMPT = """You are testing a local enterprise AI assistant.
Explain in 120-160 words why keeping an AI model on-premise can be useful for confidential industrial documents.
Mention data control, local inference, auditability, and the trade-off of local hardware resources.
Do not use markdown tables."""

def run_cmd(cmd, timeout=10):
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return p.returncode, p.stdout.strip(), p.stderr.strip()
    except Exception as e:
        return -1, "", str(e)

def nvidia_smi():
    exe = shutil.which("nvidia-smi")
    if not exe:
        return {"available": False, "error": "nvidia-smi not found"}

    query = [
        exe,
        "--query-gpu=name,memory.total,memory.used,driver_version,temperature.gpu,"
        "utilization.gpu,power.draw",
        "--format=csv,noheader,nounits",
    ]
    rc, out, err = run_cmd(query)
    if rc != 0:
        return {"available": False, "error": err or "nvidia-smi failed"}

    rows = []
    for line in out.splitlines():
        parts = [x.strip() for x in line.split(",")]
        if len(parts) >= 7:
            rows.append({
                "name": parts[0],
                "memory_total_mb": parts[1],
                "memory_used_mb": parts[2],
                "driver_version": parts[3],
                "temperature_c": parts[4],
                "utilization_gpu_pct": parts[5],
                "power_draw_w": parts[6],
            })

    # Also collect the CUDA version reported by nvidia-smi.
    _, smi_text, _ = run_cmd([exe])
    cuda = None
    for token in smi_text.splitlines():
        if "CUDA Version:" in token:
            cuda = token.split("CUDA Version:", 1)[1].strip().split()[0]
            break

    return {"available": True, "gpus": rows, "cuda_version_reported": cuda}

def system_info():
    info = {
        "timestamp": dt.datetime.now().astimezone().isoformat(),
        "hostname": platform.node(),
        "os": platform.platform(),
        "python": sys.version.split()[0],
        "cpu": platform.processor() or platform.machine(),
        "cpu_count_logical": os.cpu_count(),
    }
    if psutil:
        info["ram_total_gb"] = round(psutil.virtual_memory().total / (1024**3), 2)
    else:
        info["ram_total_gb"] = None
    return info

def ollama_get(path):
    req = urllib.request.Request(OLLAMA_URL + path, method="GET")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())

def ollama_version():
    try:
        data = ollama_get("/api/version")
        return data.get("version")
    except Exception:
        return None

def ollama_models():
    data = ollama_get("/api/tags")
    return [m.get("name") for m in data.get("models", [])]

def gpu_snapshot():
    data = nvidia_smi()
    if not data.get("available"):
        return data
    return data

def system_ram_used_gb():
    if psutil:
        return round(psutil.virtual_memory().used / (1024**3), 2)
    return None

def benchmark_model(model, runs):
    results = []

    # A short warmup helps separate cold-start behaviour from normal inference.
    for run_index in range(1, runs + 1):
        before_gpu = gpu_snapshot()
        ram_before = system_ram_used_gb()
        start = time.perf_counter()
        first_token_time = None
        final = None
        raw_text = ""

        payload = json.dumps({
            "model": model,
            "prompt": PROMPT,
            "stream": True,
            "options": {
                "temperature": 0.1,
                "seed": 42,
            }
        }).encode()

        req = urllib.request.Request(
            OLLAMA_URL + "/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=180) as response:
                while True:
                    line = response.readline()
                    if not line:
                        break
                    chunk = json.loads(line.decode())
                    if chunk.get("response"):
                        if first_token_time is None:
                            first_token_time = time.perf_counter() - start
                        raw_text += chunk["response"]
                    if chunk.get("done"):
                        final = chunk
                        break
        except Exception as e:
            results.append({
                "model": model,
                "run": run_index,
                "error": str(e),
            })
            continue

        end = time.perf_counter()
        after_gpu = gpu_snapshot()
        ram_after = system_ram_used_gb()

        total_latency = end - start
        eval_count = (final or {}).get("eval_count")
        eval_duration_ns = (final or {}).get("eval_duration")

        tokens_per_sec = None
        if eval_count and eval_duration_ns:
            tokens_per_sec = eval_count / (eval_duration_ns / 1e9)

        gpu_delta_mb = None
        try:
            b = before_gpu["gpus"][0]["memory_used_mb"]
            a = after_gpu["gpus"][0]["memory_used_mb"]
            gpu_delta_mb = float(a) - float(b)
        except Exception:
            pass

        results.append({
            "model": model,
            "run": run_index,
            "time_to_first_token_sec": round(first_token_time, 4) if first_token_time is not None else None,
            "total_response_latency_sec": round(total_latency, 4),
            "generated_tokens": eval_count,
            "generation_speed_tokens_sec": round(tokens_per_sec, 3) if tokens_per_sec else None,
            "ollama_eval_duration_sec": round(eval_duration_ns / 1e9, 4) if eval_duration_ns else None,
            "gpu_memory_delta_mb": round(gpu_delta_mb, 1) if gpu_delta_mb is not None else None,
            "system_ram_before_gb": ram_before,
            "system_ram_after_gb": ram_after,
            "output_chars": len(raw_text),
        })

    return results

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", help="Comma-separated Ollama model names. Default: first 3 installed models.")
    ap.add_argument("--runs", type=int, default=3, help="Runs per model (default: 3)")
    ap.add_argument("--output", default="sih_benchmark_results", help="Output filename prefix")
    args = ap.parse_args()

    print("=" * 72)
    print("SIH SOVEREIGN AI WORKBENCH - REAL BENCHMARK")
    print("=" * 72)

    info = system_info()
    gpu = nvidia_smi()
    version = ollama_version()

    print("\nSYSTEM")
    print(json.dumps(info, indent=2))

    print("\nGPU")
    print(json.dumps(gpu, indent=2))

    print("\nOLLAMA VERSION")
    print(version or "NOT DETECTED")

    try:
        installed = ollama_models()
    except Exception as e:
        print("\nERROR: Ollama API is not reachable.")
        print("Start Ollama and run this script again.")
        print("Details:", e)
        sys.exit(1)

    print("\nINSTALLED MODELS")
    for m in installed:
        print(" -", m)

    if args.models:
        selected = [m.strip() for m in args.models.split(",") if m.strip()]
    else:
        selected = installed[:3]

    if not selected:
        print("\nNo models available. Pull at least one local model in Ollama.")
        sys.exit(1)

    print("\nBENCHMARK MODELS:", selected)
    print("Runs per model:", args.runs)
    print("\nRunning benchmark. This can take several minutes...\n")

    all_results = []
    for model in selected:
        if model not in installed:
            print(f"WARNING: {model} is not in the installed model list; trying anyway.")
        print(f"--- {model} ---")
        results = benchmark_model(model, args.runs)
        for r in results:
            print(json.dumps(r))
        all_results.extend(results)

    report = {
        "benchmark": {
            "name": "SIH Sovereign AI Workbench local LLM benchmark",
            "timestamp": dt.datetime.now().astimezone().isoformat(),
            "prompt": PROMPT,
            "runs_per_model": args.runs,
        },
        "system": info,
        "gpu": gpu,
        "ollama_version": version,
        "installed_models": installed,
        "selected_models": selected,
        "results": all_results,
    }

    json_path = args.output + ".json"
    csv_path = args.output + ".csv"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    fieldnames = [
        "model", "run", "time_to_first_token_sec",
        "total_response_latency_sec", "generated_tokens",
        "generation_speed_tokens_sec", "ollama_eval_duration_sec",
        "gpu_memory_delta_mb", "system_ram_before_gb",
        "system_ram_after_gb", "output_chars", "error"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in all_results:
            writer.writerow(row)

    print("\n" + "=" * 72)
    print("DONE")
    print("JSON:", os.path.abspath(json_path))
    print("CSV :", os.path.abspath(csv_path))
    print("=" * 72)
    print("\nUse the JSON/CSV values to replace the placeholders in the SIH benchmark PDF.")
    print("Do not report placeholder values as measured experimental results.")

if __name__ == "__main__":
    main()
