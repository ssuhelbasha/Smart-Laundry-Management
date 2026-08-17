'use strict';
/**
 * GitHub Actions Summary Generator – Appium
 */
const fs = require('fs');

function generateSummary() {
  const jsonPath = 'reports/json/execution-results.json';
  if (!fs.existsSync(jsonPath)) {
    console.log('No results found, skipping summary');
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const { summary, results } = data;
  const failed = results.filter(r => r.status === 'FAILED');
  const passed = results.filter(r => r.status === 'PASSED');
  const modules = [...new Set(results.map(r => r.module))];

  const summaryContent = `## 🤖 Android Appium E2E Execution Summary

| Metric | Value |
|--------|-------|
| **Build Number** | #${summary.buildNumber} |
| **Execution Date** | ${summary.timestamp} |
| **Git Commit** | \`${summary.commit.substring(0, 12)}\` |
| **Branch** | ${summary.branch} |
| **Device** | ${summary.device} |
| **Android Version** | ${summary.platformVersion} |
| **App Package** | ${summary.appPackage} |

### 📊 Execution Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Total Test Cases** | ${summary.total} | 📋 |
| **✅ Passed** | ${summary.passed} | ✅ |
| **❌ Failed** | ${summary.failed} | ${summary.failed > 0 ? '❌' : '✅'} |
| **⏭️ Skipped** | ${summary.skipped} | ⏭️ |
| **Pass Percentage** | ${summary.passRate}% | ${parseFloat(summary.passRate) >= 95 ? '✅ Above Threshold' : '❌ Below 95%'} |
| **Execution Duration** | ${summary.executionTimeSec}s | ⏱️ |

### 📈 Module-wise Results

| Module | Total | ✅ Passed | ❌ Failed | Pass Rate |
|--------|-------|-----------|-----------|-----------|
${modules.map(mod => {
  const mTests  = results.filter(r => r.module === mod);
  const mPassed = mTests.filter(r => r.status === 'PASSED').length;
  const mFailed = mTests.filter(r => r.status === 'FAILED').length;
  const mRate   = ((mPassed / mTests.length) * 100).toFixed(1);
  return `| ${mod} | ${mTests.length} | ${mPassed} | ${mFailed} | ${mRate}% ${parseFloat(mRate)>=95?'✅':'❌'} |`;
}).join('\n')}

${failed.length > 0 ? `### ❌ Failed Tests

| Test ID | Module | Test Name | Failure Reason |
|---------|--------|-----------|----------------|
${failed.map(tc => `| \`${tc.id}\` | ${tc.module} | ${tc.name} | ${tc.failureReason || 'Unknown'} |`).join('\n')}
` : '### ✅ All Tests Passed!\n\nNo failures detected in this run.\n'}

### ✅ Sample Passed Tests

${passed.slice(0, 10).map(tc => `✓ \`${tc.id}\` – ${tc.name}`).join('\n')}

### 📦 Artifacts Generated

- ✅ \`Automation_Test_Report.xlsx\` (7 sheets)
- ✅ \`execution-report.html\`
- ✅ \`execution-results.json\`
- ✅ \`summary.md\`
- ✅ Screenshots directory
- ✅ Logs directory

---
*Powered by Smart Laundry QA Automation Framework*
`;

  // Write to GitHub Step Summary
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, summaryContent);
    console.log('✅ GitHub Actions summary published');
  } else {
    console.log(summaryContent);
  }
}

generateSummary();
