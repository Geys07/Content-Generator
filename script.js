function generate() {
  let input = document.getElementById("input").value;

  let output = `
    <div class="card">Storytelling: ...</div>
    <div class="card">FOMO: ...</div>
    <div class="card">Problem-Solution: ...</div>
    <div class="card">Curiosity: ...</div>
    <div class="card">Social Proof: ...</div>
  `;

  document.getElementById("output").innerHTML = output;
}