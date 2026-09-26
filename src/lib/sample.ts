const SAMPLE_HTML = `<!doctype html><html><head><title>Operating Systems — Unit 3 Notes</title></head><body><main>
<h1>Operating Systems — Unit 3: Memory Management</h1>
<p>Memory management decides <strong>which process gets which part of RAM</strong>, and when. These notes cover paging, segmentation and page replacement.</p>
<h2>1. Paging</h2>
<p>Physical memory is split into fixed-size <em>frames</em>; logical memory into <em>pages</em> of the same size. The page table maps one to the other.</p>
<ul><li>No external fragmentation</li><li>Small internal fragmentation (last page)</li><li>Needs hardware support: the <code>TLB</code></li></ul>
<h2>2. Page replacement algorithms</h2>
<table><thead><tr><th>Algorithm</th><th>Idea</th><th>Belady's anomaly?</th></tr></thead>
<tbody><tr><td>FIFO</td><td>Evict the oldest page</td><td>Yes</td></tr>
<tr><td>LRU</td><td>Evict the least recently used page</td><td>No</td></tr>
<tr><td>Optimal</td><td>Evict the page used furthest in the future</td><td>No</td></tr></tbody></table>
<h2>3. Effective access time</h2>
<blockquote>EAT = hit ratio × (TLB + memory) + miss ratio × (TLB + 2 × memory)</blockquote>
<pre><code class="language-python">def eat(hit, tlb=20, mem=100):
    return hit * (tlb + mem) + (1 - hit) * (tlb + 2 * mem)

print(eat(0.8))  # 140.0 ns
</code></pre>
<p>Exam tip: always state your assumptions before plugging numbers into the formula.</p>
</main></body></html>`

export function sampleFile(): File {
  return new File([SAMPLE_HTML], 'os-unit-3-notes.html', { type: 'text/html' })
}
