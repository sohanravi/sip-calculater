document.getElementById('showInflation').addEventListener('change', function() {
  document.getElementById('inflationBox').style.display = this.checked ? 'block' : 'none';
});
document.getElementById('toggleAdvanced').addEventListener('click', function() {
  const adv = document.getElementById('advancedSection');
  if (adv.style.display === 'none') {
    adv.style.display = 'block';
    this.textContent = 'Hide Advanced Features ▲';
  } else {
    adv.style.display = 'none';
    this.textContent = 'Show Advanced Features ▼';
  }
});
document.getElementById('volatilityCheck').addEventListener('change', function() {
  document.getElementById('volatilityBox').style.display = this.checked ? 'block' : 'none';
});

document.getElementById('sipForm').addEventListener('submit', function(e) {
  e.preventDefault();
  // Get simple fields
  const amount = Number(document.getElementById('amount').value);
  const rate = Number(document.getElementById('rate').value);
  const years = Number(document.getElementById('years').value);
  const stepUp = Number(document.getElementById('stepUp').value);
  const showInflation = document.getElementById('showInflation').checked;
  const inflation = showInflation ? Number(document.getElementById('inflation').value) : 0;

  // Get advanced fields (if visible)
  const goalAmount = Number(document.getElementById('goalAmount').value);
  const stepUpFreq = document.getElementById('stepUpFreq').value;
  const pauseMonths = document.getElementById('pauseMonths').value.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m));
  const invType = document.getElementById('invType').value;
  const taxSlab = Number(document.getElementById('taxSlab').value);
  const volatilityEnabled = document.getElementById('volatilityCheck').checked;
  const volatility = volatilityEnabled ? Number(document.getElementById('volatility').value) : 0;

  let totalInvested = 0, futureValue = 0, adjustedValue = 0;
  let currentAmount = amount;
  let monthCount = years * 12;
  let stepUpInterval = stepUpFreq === 'monthly' ? 1 : (stepUpFreq === 'quarterly' ? 3 : 12);
  let stepUpCounter = 0;
  let monthIdx = 1;
  let fvArr = [];
  for (let i = 1; i <= years; i++) {
    for (let m = 1; m <= 12; m++, monthIdx++) {
      // Pause logic
      if (pauseMonths.includes(monthIdx)) {
        fvArr.push(0);
        continue;
      }
      let effRate = rate;
      // Volatility logic
      if (volatilityEnabled && volatility > 0) {
        // Simulate random rate for this month
        let randomChange = (Math.random() * 2 - 1) * volatility;
        effRate = rate + randomChange;
      }
      let monthlyInvest = currentAmount;
      totalInvested += monthlyInvest;
      let monthsLeft = monthCount - (monthIdx - 1);
      let fv = monthlyInvest * Math.pow(1 + effRate / 100 / 12, monthsLeft);
      futureValue += fv;
      fvArr.push(fv);
      // Step-up logic
      stepUpCounter++;
      if (stepUpCounter === stepUpInterval) {
        currentAmount += stepUp;
        stepUpCounter = 0;
      }
    }
  }
  adjustedValue = futureValue / Math.pow(1 + inflation / 100, years);

  // Tax calculation
  let postTaxValue = futureValue;
  if (invType !== 'none' && taxSlab > 0) {
    let gain = futureValue - totalInvested;
    let tax = 0;
    if (invType === 'elss') {
      // Assume LTCG 10% after 1 lakh exemption
      tax = Math.max(0, gain - 100000) * 0.10;
    } else if (invType === 'debt') {
      // Assume slab rate for simplicity
      tax = gain * (taxSlab / 100);
    }
    postTaxValue = futureValue - tax;
  }

  let goalHtml = '';
  if (goalAmount > 0) {
    const progress = Math.min(100, Math.round((futureValue / goalAmount) * 100));
    goalHtml = `
      <div class="goal-progress">
        <div class="goal-label">Goal Progress: <b>${progress}%</b> (${futureValue >= goalAmount ? 'Goal Achieved!' : '₹' + futureValue.toLocaleString(undefined, {maximumFractionDigits:0}) + ' / ₹' + goalAmount.toLocaleString(undefined, {maximumFractionDigits:0})})</div>
        <div class="goal-bar-bg"><div class="goal-bar" style="width:${progress}%;"></div></div>
      </div>
    `;
  }
  let taxHtml = '';
  if (invType !== 'none' && taxSlab > 0) {
    taxHtml = `<div class="sub" style="color:#d2691e;">Post-Tax Value: <b>₹${postTaxValue.toLocaleString(undefined, {maximumFractionDigits:0})}</b></div>`;
  }
  let volatilityHtml = '';
  if (volatilityEnabled && volatility > 0) {
    // Show a range for best/worst/average case
    let simResults = [];
    for (let sim = 0; sim < 100; sim++) {
      let simFV = 0, simAmount = amount, simStepUpCounter = 0, simMonthIdx = 1;
      for (let i = 1; i <= years; i++) {
        for (let m = 1; m <= 12; m++, simMonthIdx++) {
          if (pauseMonths.includes(simMonthIdx)) continue;
          let effRate = rate + ((Math.random() * 2 - 1) * volatility);
          let monthsLeft = monthCount - (simMonthIdx - 1);
          let fv = simAmount * Math.pow(1 + effRate / 100 / 12, monthsLeft);
          simFV += fv;
          simStepUpCounter++;
          if (simStepUpCounter === stepUpInterval) {
            simAmount += stepUp;
            simStepUpCounter = 0;
          }
        }
      }
      simResults.push(simFV);
    }
    simResults.sort((a,b)=>a-b);
    let worst = simResults[0];
    let best = simResults[simResults.length-1];
    let avg = simResults[Math.floor(simResults.length/2)];
    volatilityHtml = `<div class="sub" style="color:#b22222;">Market Simulation: <br>Best: <b>₹${best.toLocaleString(undefined, {maximumFractionDigits:0})}</b> | Avg: <b>₹${avg.toLocaleString(undefined, {maximumFractionDigits:0})}</b> | Worst: <b>₹${worst.toLocaleString(undefined, {maximumFractionDigits:0})}</b></div>`;
  }
  document.getElementById('result').innerHTML = `
    <div class="result-premium-card">
      <div class="result-row">
        <span class="result-icon invest">💸</span>
        <span class="result-label">Total Investment</span>
        <span class="result-value invest">₹${totalInvested.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
      </div>
      <div class="result-row">
        <span class="result-icon interest">📈</span>
        <span class="result-label">Total Interest</span>
        <span class="result-value interest">₹${(futureValue-totalInvested).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
      </div>
      <div class="result-row">
        <span class="result-icon value">🏦</span>
        <span class="result-label">Total Value</span>
        <span class="result-value value">₹${futureValue.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
      </div>
      ${taxHtml}
      ${goalHtml}
      ${volatilityHtml}
      <div class="note">All calculations are estimates. Please consult a financial advisor before investing.</div>
    </div>
    <button id="resetBtn" class="reset-btn">Reset</button>
  `;

  document.getElementById('resetBtn').onclick = function() {
    // Reset all form fields (simple and advanced)
    document.getElementById('sipForm').reset();
    if (document.getElementById('advancedForm')) document.getElementById('advancedForm').reset();
    // Hide result
    document.getElementById('result').innerHTML = '';
    // Hide inflation and volatility boxes
    document.getElementById('inflationBox').style.display = 'none';
    if (document.getElementById('volatilityBox')) document.getElementById('volatilityBox').style.display = 'none';
  };
});
