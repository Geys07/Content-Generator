async function generate() {
  let input = document.getElementById("input").value;

  if (!input) {
    alert("Isi dulu produk Anda");
    return;
  }

  document.getElementById("output").innerHTML = "Loading...";

  try {
    let res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input })
    });

    let data = await res.json();

    document.getElementById("output").innerHTML =
      `<div class="card">${data.result.replace(/\n/g, "<br>")}</div>`;

  } catch (err) {
    document.getElementById("output").innerHTML = "Error";
  }
}
