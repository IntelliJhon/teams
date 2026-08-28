const ngrok = require('@ngrok/ngrok');

(async function() {
  try {
    const listener = await ngrok.forward({
      addr: 3000,
      authtoken: "3IG5p3E2rGaCRvxOnQVoY8ysDoh_4TYRomgzoWUAVd9VRH5HQ"
    });
    console.log(`\n========================================`);
    console.log(`ngrok Tunnel URL: ${listener.url()}`);
    console.log(`Forwarding to: http://localhost:3000`);
    console.log(`========================================\n`);

    // Keep process open
    process.stdin.resume();
  } catch (err) {
    console.error("Failed to start ngrok tunnel:", err);
  }
})();
