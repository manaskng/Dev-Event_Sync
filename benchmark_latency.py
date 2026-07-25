import time
import requests
import statistics

# Make sure your FastAPI server is running locally on port 8000
URL = "http://localhost:8000/recommend/opportunities"

# A mock user profile matching your Pydantic schema
payload = {
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

def run_benchmark(num_requests=100):
    print(f"Warming up server with 5 requests...")
    for _ in range(5):
        requests.post(URL, json=payload)
        
    print(f"\nRunning {num_requests} benchmark requests...")
    latencies = []
    
    for i in range(num_requests):
        start_time = time.perf_counter()
        response = requests.post(URL, json=payload)
        end_time = time.perf_counter()
        
        if response.status_code == 200:
            duration_ms = (end_time - start_time) * 1000
            latencies.append(duration_ms)
        else:
            print(f"Request failed: {response.status_code}")
            
    if not latencies:
        print("All requests failed. Is the server running?")
        return
        
    # Calculate Percentiles
    p50 = statistics.median(latencies)
    
    # Sort for p95 calculation
    latencies.sort()
    p95_index = int(len(latencies) * 0.95)
    p95 = latencies[p95_index]
    
    print("\n" + "="*40)
    print("BENCHMARK RESULTS")
    print("="*40)
    print(f"Total Requests: {len(latencies)}")
    print(f"Median Latency (p50): {p50:.2f} ms")
    print(f"95th Percentile Latency (p95): {p95:.2f} ms")
    print(f"Max Latency: {max(latencies):.2f} ms")
    print("="*40)
    print("\nUse the p95 number on your resume!")

if __name__ == "__main__":
    try:
        run_benchmark(100)
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the FastAPI server. Please start it using 'uvicorn main:app --reload' on port 8000.")
