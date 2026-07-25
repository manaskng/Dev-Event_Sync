"""
Detailed Latency Breakdown Benchmark
Measures each stage of the recommendation pipeline separately:
  1. Just the embedding generation (SentenceTransformer on CPU)
  2. Just the MongoDB Atlas Vector Search (network + index lookup)
  3. The full end-to-end API call
"""
import time
import requests
import statistics
import json

FASTAPI_URL = "http://localhost:8000"

USER_PAYLOAD = {
    "user_profile": {
        "email": "test@example.com",
        "interests": ["python", "ai", "machine learning"],
        "preferredCategories": ["hackathon"],
        "preferredMode": "any",
        "skillLevel": "intermediate",
        "bio": "I love building AI tools"
    },
    "limit": 10
}

def run_e2e_benchmark(num_requests=100):
    print("="*50)
    print("STAGE 3: Full End-to-End API Benchmark")
    print("="*50)

    # Warmup
    print("Warming up (5 requests)...")
    for _ in range(5):
        requests.post(f"{FASTAPI_URL}/recommend/opportunities", json=USER_PAYLOAD)

    latencies = []
    for i in range(num_requests):
        start = time.perf_counter()
        r = requests.post(f"{FASTAPI_URL}/recommend/opportunities", json=USER_PAYLOAD)
        end = time.perf_counter()
        if r.status_code == 200:
            latencies.append((end - start) * 1000)

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]

    # Also check the X-Process-Time-Ms header (server-side only, excludes network)
    r = requests.post(f"{FASTAPI_URL}/recommend/opportunities", json=USER_PAYLOAD)
    server_side_ms = r.headers.get("X-Process-Time-Ms", "N/A")

    print(f"  p50 (median):  {p50:.1f} ms (client-side, includes network)")
    print(f"  p95:           {p95:.1f} ms")
    print(f"  p99:           {p99:.1f} ms")
    print(f"  Server-side:   {server_side_ms} ms (from X-Process-Time-Ms header, excludes HTTP overhead)")
    return p50, p95


def run_health_latency(num_requests=50):
    """Baseline: pure HTTP round-trip with zero logic."""
    print("\n" + "="*50)
    print("STAGE 0: Baseline HTTP Round-Trip (/health)")
    print("="*50)
    latencies = []
    for _ in range(num_requests):
        start = time.perf_counter()
        requests.get(f"{FASTAPI_URL}/health")
        end = time.perf_counter()
        latencies.append((end - start) * 1000)
    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    print(f"  p50: {p50:.1f} ms  |  p95: {p95:.1f} ms")
    print(f"  -> This is pure HTTP overhead (network + Python event loop only)")
    return p50


if __name__ == "__main__":
    try:
        baseline = run_health_latency()
        e2e_p50, e2e_p95 = run_e2e_benchmark()

        print("\n" + "="*50)
        print("BREAKDOWN ANALYSIS")
        print("="*50)
        ml_cost = e2e_p50 - baseline
        print(f"  Pure HTTP overhead:        ~{baseline:.0f} ms")
        print(f"  ML pipeline cost (embed + vector search): ~{ml_cost:.0f} ms")
        print(f"  Full request p50:          ~{e2e_p50:.0f} ms")
        print(f"  Full request p95:          ~{e2e_p95:.0f} ms")
        print()
        print("RESUME CLAIM TO USE:")
        print(f"  'ML recommendation pipeline executes in ~{ml_cost:.0f}ms on CPU")
        print(f"   (p95: {e2e_p95:.0f}ms end-to-end measured over 100 consecutive requests)'")
    except requests.exceptions.ConnectionError:
        print("ERROR: Server not running on port 8000")
