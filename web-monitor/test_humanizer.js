const text = 'Hence, we can definitively deduce that the multifaceted impact of modern technological paradigms catalyzes unprecedented transformations across the global socio-economic landscape. In essentially every measurable vector, AI represents a massive leap forward.';

async function run() {
  console.log("Original Text:", text);
  
  const promises = [0, 1, 2, 3, 4].map(async (i) => {
    try {
      const res = await fetch('http://localhost:3005/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, versionIndex: i })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  const results = await Promise.all(promises);
  results.forEach((r, i) => {
    if (r.success) {
      console.log('\n=======================================');
      console.log(`VERSION ${i+1}: ${r.version.name}`);
      console.log('=======================================');
      console.log(r.version.content);
    } else {
      console.log(`\nVERSION ${i+1} FAILED:`, r.error);
    }
  });
}

run();
