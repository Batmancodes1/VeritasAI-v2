const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
let extractedData = null;

function setStatus(msg) {
  statusEl.innerText = msg;
}

function showError(title, detail) {
  resultEl.style.display = "block";
  resultEl.innerHTML = `
    <div style="padding:10px;background:#FF3D5A12;border:1px solid #FF3D5A30;border-radius:6px;font-size:11px;color:#FF8FA0;">
      <strong>${title}</strong><br>${detail}
    </div>
  `;
}

btn.addEventListener("click", async () => {
  btn.disabled = true;
  resultEl.style.display = "none";
  setStatus("Extracting page content...");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) {
      showError("Error", "No active tab");
      btn.disabled = false;
      return;
    }

    // Robust extraction fallback specifically for news sites
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const article =
          document.querySelector("article") ||
          document.querySelector('[role="main"]');
        let text = "";

        if (article && article.innerText.length > 200) {
          text = article.innerText;
        } else {
          // Fallback: collect all paragraphs (works flawlessly on BBC, CNN, Reuters)
          const paras = Array.from(document.querySelectorAll("p")).map(
            (p) => p.innerText,
          );
          text = paras.join("\n");
        }

        // Clean up whitespace and restrict length
        text = text.replace(/\s+/g, " ").slice(0, 4000);
        return { text, title: document.title, url: window.location.href };
      },
    });

    if (!result || !result.text || result.text.length < 50) {
      showError(
        "Extraction Failed",
        "Could not find enough readable article content on this page. Try a different news article.",
      );
      setStatus("");
      btn.disabled = false;
      return;
    }

    extractedData = result;
    setStatus("Verifying claims against model...");

    let data;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch("http://127.0.0.1:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text: result.text,
          headline: result.title,
          source_url: result.url,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error("Backend Offline");
      data = await response.json();
    } catch (err) {
      showError(
        "Connection Error",
        "Cannot reach local backend. Please make sure you are running 'python app.py' in your terminal.",
      );
      setStatus("");
      btn.disabled = false;
      return;
    }

    setStatus("");
    resultEl.style.display = "block";

    // Set colors based on new absolute verdict system
    let color = "#FFB830"; // Yellow for unestablished
    let icon = "⚠️";
    if (data.verdict === "VERIFIED REAL") {
      color = "#00E5A0";
      icon = "✅";
    }
    if (data.verdict === "VERIFIED FAKE") {
      color = "#FF3D5A";
      icon = "❌";
    }

    resultEl.innerHTML = `
      <div style="background:#0D1117; border:1px solid #1E2D3D; border-radius:10px; padding:12px;">
        <div style="font-size:18px; font-weight:800; color:${color}; margin-bottom:12px;">
          ${icon} ${data.verdict}
        </div>
        
        <div style="font-size:11px; margin-bottom:8px;">
          🛡️ <strong>Corroboration:</strong><br>
          <span style="color:#6B7F94">${data.corroboration}</span>
        </div>
        
        <hr style="margin:8px 0; border-color:#1E2D3D;">
        
        <div style="font-size:11px; margin-bottom:8px;">
          🔍 <strong>Entities Found:</strong> ${data.entities.length}<br>
          <span style="color:#6B7F94; font-family:monospace;">${data.verification_query}</span>
        </div>
        
        <hr style="margin:8px 0; border-color:#1E2D3D;">
        
        <div style="font-size:11px; margin-bottom:8px;">
          📰 <strong>Narrative:</strong> ${data.narrative_consistency}
        </div>
        <div style="font-size:11px; margin-bottom:8px;">
          🌐 <strong>Source:</strong> ${data.source.status}
        </div>
        
        <hr style="margin:8px 0; border-color:#1E2D3D;">
        
        <div style="font-size:11px; color:#6B7F94; border-left:2px solid #1E2D3D; padding-left:8px; line-height:1.5;">
          💡 ${data.explanation}
        </div>
      </div>
      <button id="btn-dashboard" class="btn btn-dash">Open in Dashboard</button>
    `;

    // Dashboard Integration Link
    document.getElementById("btn-dashboard").addEventListener("click", () => {
      // 127.0.0.1:5000 serves the frontend natively now via app.py
      const dashboardUrl = `http://127.0.0.1:5000/?dashboard=1&headline=${encodeURIComponent(extractedData.title)}&url=${encodeURIComponent(extractedData.url)}&text=${encodeURIComponent(extractedData.text)}`;
      chrome.tabs.create({ url: dashboardUrl });
    });
  } catch (error) {
    showError("Unexpected Error", error.message);
    setStatus("");
  }
  btn.disabled = false;
});
