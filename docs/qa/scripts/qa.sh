# Shell helpers for driving Playground tutorials QA with agent-browser.
# Usage (zsh/bash): source docs/qa/scripts/qa.sh
#
# Environment:
#   QA_SESSION   agent-browser session name (default: qa)
#   BASE         Playground URL (default: http://localhost:3000)
#   QA_LOG       findings log file (default: /tmp/playground-qa-findings.md)
#
# Launch the browser first (see docs/qa/README.md), e.g.:
#   agent-browser --session qa --extension ~/miden/extensions/bread-wallet \
#     --profile ~/miden/extensions/qa-profile-2 open "$BASE"

QA_SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")" && pwd)"
QA_SESSION="${QA_SESSION:-qa}"
BASE="${BASE:-http://localhost:3000}"
QA_LOG="${QA_LOG:-/tmp/playground-qa-findings.md}"

ab() { agent-browser --session "$QA_SESSION" "$@"; }
snap() { ab snapshot -i; }
# ref <fixed-string>: first @ref whose snapshot line contains the string
ref() { snap | grep -F -- "$1" | head -1 | sed -E 's/.*ref=(e[0-9]+).*/@\1/'; }
# clk <fixed-string>: real pointer click (needed for Radix menus/selects/switches)
clk() { local r; r=$(ref "$1"); [ -n "$r" ] || { echo "NOT FOUND: $1"; return 1; }; ab click "$r" >/dev/null; }
# jsclick <exact text>: DOM click, bypasses toasts/overlays covering the element.
# Does NOT open Radix dropdowns (they listen to pointerdown): use clk for those.
jsclick() { ab eval "(()=>{const e=[...document.querySelectorAll('button,a,[role=menuitem],[role=option],[role=tab]')].filter(e=>e.innerText.trim()==='$1'&&!e.disabled);if(!e.length)return 'NOT FOUND $1';e[e.length-1].click();return 'clicked $1'})()"; }
step() { ab eval "document.body.innerText.match(/Step \\d+ of \\d+/)?.[0] ?? 'no-step'"; }
# panel [chars]: tutorial side panel text
panel() { ab eval "(()=>{const t=document.body.innerText;const i=t.search(/Step \\d+ of \\d+/);return t.slice(i,i+${1:-1500})})()"; }
nextstep() { jsclick 'Next step'; }
nextenabled() { snap | grep -q 'button "Next step" \[ref'; }
# waitnext [tries]: poll every 10s until Next step is enabled
waitnext() { for i in $(seq 1 ${1:-30}); do nextenabled && { echo NEXT-ENABLED; return 0; }; ab wait 10000 >/dev/null; done; echo NEXT-STILL-DISABLED; return 1; }
# Account component procedures (Components tab)
invoke() { ab eval "(()=>{const r=[...document.querySelectorAll('tr')].find(t=>t.querySelector('td')?.innerText.trim()==='$1');const b=r&&[...r.querySelectorAll('button')].find(b=>b.innerText.includes('Invoke'));if(!b)return 'NO INVOKE $1';b.click();return 'invoked $1'})()"; }
procresult() { ab eval "(()=>{const r=[...document.querySelectorAll('tr')].find(t=>t.querySelector('td')?.innerText.trim()==='$1');return r?r.innerText.replace(/\s+/g,' '):'no row'})()"; }
# Bread Wallet popups (confirm.html) over raw CDP
cdpport() { ab get cdp-url | sed -E 's#ws://127.0.0.1:([0-9]+)/.*#\1#'; }
popup() { node "$QA_SCRIPTS/cdp.mjs" "$(cdpport)" "${2:-confirm.html}" "$1"; }
haspopup() { curl -s "http://127.0.0.1:$(cdpport)/json/list" | grep -q confirm.html; }
popuptext() { popup "document.body.innerText" "$1" | tr '\n' ' '; echo; }
popupclick() { popup "(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='$1' && !b.disabled);if(!b)return 'NO BUTTON $1';b.click();return 'clicked $1'})()" "${2:-confirm.html}"; }
# waitpopup [button] [tries]: wait until the popup's button is enabled
waitpopup() { for i in $(seq 1 ${2:-30}); do popup "[...document.querySelectorAll('button')].some(b=>b.innerText.trim()==='${1:-Confirm}' && !b.disabled) ? 'ready' : ''" 2>/dev/null | grep -q ready && return 0; node -e 'setTimeout(()=>{},2000)'; done; echo POPUP-TIMEOUT; return 1; }
# breadconnect: approve a connect popup, ticking the risk checkbox (often unchecked)
breadconnect() { for i in $(seq 1 10); do haspopup && break; ab wait 1500 >/dev/null; done; haspopup || return 0; popup "(()=>{const i=document.querySelector('input[type=checkbox]');if(i&&!i.checked)i.click();return i?i.checked:'nobox'})()" >/dev/null; popupclick Connect; }
# approveloop <seconds> <stop-cmd>: approve every Bread popup (opaque signatures etc.)
# until stop-cmd succeeds. Used for Guardian flows (tutorial 5).
approveloop() { local end=$(( $(date +%s) + ${1:-120} )); local n=0; while [ "$(date +%s)" -lt $end ]; do if haspopup; then r=$(popup "(()=>{const b=[...document.querySelectorAll('button')].find(b=>['Confirm','Sign','Approve','Connect'].includes(b.innerText.trim())&&!b.disabled);if(!b)return '';b.click();return b.innerText.trim()})()" 2>/dev/null); [ -n "$r" ] && { n=$((n+1)); echo "approved#$n [$r]"; }; fi; [ -n "$2" ] && eval "$2" >/dev/null 2>&1 && { echo STOP-COND-MET; return 0; }; node -e 'setTimeout(()=>{},1500)'; done; echo "LOOP-TIMEOUT approvals=$n"; }
# pointer click at viewport coordinates (Para modal, Radix listbox options)
mouseclick() { ab mouse move "$1" "$2" >/dev/null; ab mouse down >/dev/null; ab mouse up >/dev/null; }
# options: print listbox options with clickable coordinates
options() { ab eval "[...document.querySelectorAll('[role=option]')].map(o=>o.innerText+' @'+Math.round(o.getBoundingClientRect().x+50)+','+Math.round(o.getBoundingClientRect().y+14)).join('\n')"; }
toasts() { ab eval "[...document.querySelectorAll('[data-sonner-toast]')].map(t=>t.dataset.type+': '+t.innerText.replace(/\n/g,' | ')).join('\n')"; }
note() { echo "- $*" >> "$QA_LOG"; }
