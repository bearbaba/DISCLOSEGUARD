import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';
import {TransactionHashVariant} from 'genlayer-stable/types';

const address='0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981';
const client=createClient({chain:studionet});
const code=readFileSync('contracts/discloseguard.py','utf8');
const normalize=s=>s.replace(/\r\n/g,'\n').split('\n').map(x=>x.replace(/\s+$/g,'')).join('\n').trimEnd();
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const expected=[
 'create_review','assign_reviewer','submit_disclosure','assess_conflict',
 'submit_review','update_rules','revoke_reviewer','close_review','authorization',
 'get_review','get_assignment','get_disclosure','get_assessment','receipt_for',
 'get_receipt','stats'
];

console.log('NETWORK:', 'GenLayer Studionet 61999');
console.log('ADDRESS:',address);
const deployed=await client.getContractCode(address);
if(typeof deployed!=='string'||!deployed.includes('class DiscloseGuard(gl.Contract)'))
 throw Error('Deployed DiscloseGuard source unavailable or unexpected');
console.log('LOCAL_SHA256:',hash(code));
console.log('DEPLOYED_SHA256:',hash(deployed));
console.log('SOURCE_NORMALIZED_MATCH:',normalize(code)===normalize(deployed));
if(normalize(code)!==normalize(deployed))throw Error('Deployed source differs from current repository');
const schema=await client.getContractSchema(address);
const methods=schema?.methods||{};
const missing=expected.filter(x=>!Object.hasOwn(methods,x));
if(missing.length)throw Error('Missing methods: '+missing.join(', '));
console.log('CONSTRUCTOR:',JSON.stringify(schema.ctor));
console.log('METHODS:',Object.keys(methods).join(', '));
const result=await client.readContract({address,functionName:'stats',args:[],
 transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
const state=typeof result==='string'?JSON.parse(result):result;
if(!Number.isSafeInteger(state?.reviews)||!Number.isSafeInteger(state?.submitted_receipts))
 throw Error('Unexpected stats result');
console.log('LATEST_FINAL_STATS:',JSON.stringify(state));
if(state.reviews>=1) {
 const raw=await client.readContract({address,functionName:'get_review',args:[1],
  transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const review=typeof raw==='string'?JSON.parse(raw):raw;
 console.log('LATEST_FINAL_REVIEW_1:',JSON.stringify({id:review.id,chair:review.chair,
  rules_version:review.rules_version,active:review.active,title:review.title}));
}
console.log('DISCLOSEGUARD_DEPLOYMENT_PREFLIGHT_PASS');
