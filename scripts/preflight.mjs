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
 if(review.id!==1||review.chair?.toLowerCase()!=='0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb'||review.title!=='Grant Round Alpha reviewer eligibility') throw Error('Review #1 readback mismatch');
 console.log('LATEST_FINAL_REVIEW_1:',JSON.stringify({id:review.id,chair:review.chair,
  rules_version:review.rules_version,active:review.active,title:review.title}));
}
if(state.reviews>=1) {
 const reviewer='0x60Bfdf6315294c7856Acdc0B80D7Bd40217DEBff';
 const assignmentRaw=await client.readContract({address,functionName:'get_assignment',
  args:[1,reviewer],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const assignment=typeof assignmentRaw==='string'?JSON.parse(assignmentRaw):assignmentRaw;
 if(assignment.review_id!==1||assignment.version!==1||assignment.active!==true||
    assignment.reviewer?.toLowerCase()!==reviewer.toLowerCase())throw Error('Reviewer A assignment mismatch');
 console.log('LATEST_FINAL_ASSIGNMENT_A:',JSON.stringify({review_id:assignment.review_id,reviewer:assignment.reviewer,version:assignment.version,active:assignment.active}));
 const disclosureRaw=await client.readContract({address,functionName:'get_disclosure',
  args:[1,reviewer],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const disclosure=typeof disclosureRaw==='string'?JSON.parse(disclosureRaw):disclosureRaw;
 if(disclosure.review_id!==1||disclosure.version!==1||
    disclosure.assignment_version!==1||disclosure.reviewer?.toLowerCase()!==reviewer.toLowerCase()||
    !disclosure.relationship?.includes('paid adviser to Project Cedar'))
  throw Error('Reviewer A signed disclosure mismatch');
 console.log('LATEST_FINAL_DISCLOSURE_A:',JSON.stringify({review_id:disclosure.review_id,reviewer:disclosure.reviewer,version:disclosure.version,assignment_version:disclosure.assignment_version,sha256:disclosure.sha256}));
 const authorizationRaw=await client.readContract({address,functionName:'authorization',
  args:[1,reviewer],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const auth=typeof authorizationRaw==='string'?JSON.parse(authorizationRaw):authorizationRaw;
 const assessmentRaw=await client.readContract({address,functionName:'get_assessment',
  args:[1,reviewer],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const assessment=typeof assessmentRaw==='string'?JSON.parse(assessmentRaw):assessmentRaw;
 if(assessment?.verdict!=='RECUSE'||assessment.review_id!==1||
    assessment.reviewer?.toLowerCase()!==reviewer.toLowerCase()||
    assessment.assignment_version!==1||assessment.disclosure_version!==1||assessment.rules_version!==1)
  throw Error('Expected finalized RECUSE assessment not found');
 console.log('LATEST_FINAL_ASSESSMENT_A:',JSON.stringify({review_id:assessment.review_id,reviewer:assessment.reviewer,verdict:assessment.verdict,assignment_version:assessment.assignment_version,disclosure_version:assessment.disclosure_version,rules_version:assessment.rules_version}));
 if(auth.allowed!==false||auth.verdict!=='RECUSE')throw Error('RECUSE must deny reviewer submission');
 const receiptRaw=await client.readContract({address,functionName:'receipt_for',
  args:[1,reviewer],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 if(receiptRaw!==''&&receiptRaw!==null)throw Error('Disqualified Reviewer A unexpectedly has receipt');
 console.log('RECUSE_NO_RECEIPT_PASS');
 console.log('RECUSE_ACCESS_DENIED_PASS');
 console.log('LATEST_FINAL_AUTHORIZATION_A:',JSON.stringify({allowed:auth.allowed,verdict:auth.verdict,rules_version:auth.rules_version,disclosure_version:auth.disclosure_version}));
}
if(state.reviews>=1) {
 const reviewerB='0xD6b8A3A5eB329410D9504784812b8569afA8C2aF';
 const raw=await client.readContract({address,functionName:'get_assignment',
  args:[1,reviewerB],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const assignment=typeof raw==='string'?JSON.parse(raw):raw;
 if(assignment.review_id!==1||assignment.version!==1||assignment.active!==true||
    assignment.reviewer?.toLowerCase()!==reviewerB.toLowerCase())
  throw Error('Reviewer B assignment mismatch');
 console.log('LATEST_FINAL_ASSIGNMENT_B:',JSON.stringify({review_id:assignment.review_id,reviewer:assignment.reviewer,version:assignment.version,active:assignment.active}));
 const authRaw=await client.readContract({address,functionName:'authorization',
  args:[1,reviewerB],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const auth=typeof authRaw==='string'?JSON.parse(authRaw):authRaw;
 const disclosureRaw=await client.readContract({address,functionName:'get_disclosure',
  args:[1,reviewerB],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const disclosure=typeof disclosureRaw==='string'?JSON.parse(disclosureRaw):disclosureRaw;
 if(disclosure.review_id!==1||disclosure.version<1||disclosure.assignment_version!==1||
    disclosure.reviewer?.toLowerCase()!==reviewerB.toLowerCase()||
    !disclosure.relationship?.includes('Project Cedar'))
  throw Error('Reviewer B disclosure mismatch');
 console.log('LATEST_FINAL_DISCLOSURE_B:',JSON.stringify({review_id:disclosure.review_id,reviewer:disclosure.reviewer,version:disclosure.version,assignment_version:disclosure.assignment_version,sha256:disclosure.sha256}));
 const assessmentRaw=await client.readContract({address,functionName:'get_assessment',
  args:[1,reviewerB],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const assessment=typeof assessmentRaw==='string'?JSON.parse(assessmentRaw):assessmentRaw;
 if(!assessment || !['REVIEW_REQUIRED','ELIGIBLE','RECUSE'].includes(assessment.verdict)||
    assessment.review_id!==1||assessment.reviewer?.toLowerCase()!==reviewerB.toLowerCase())
  throw Error('Reviewer B assessment missing or invalid');
 if(assessment.verdict==='REVIEW_REQUIRED'&&auth.allowed!==false)
  throw Error('REVIEW_REQUIRED cannot authorize reviewer');
 if(assessment.disclosure_version!==disclosure.version) {
  if(auth.allowed!==false)throw Error('Stale disclosure assessment cannot authorize reviewer');
  console.log('STALE_ASSESSMENT_DENIED:',JSON.stringify({current_disclosure_version:disclosure.version,old_assessment_version:assessment.disclosure_version,allowed:auth.allowed}));
 }
 console.log('LATEST_FINAL_ASSESSMENT_B:',JSON.stringify({review_id:assessment.review_id,
   verdict:assessment.verdict,disclosure_version:assessment.disclosure_version,
   rules_version:assessment.rules_version,assignment_version:assessment.assignment_version}));
 console.log('LATEST_FINAL_AUTHORIZATION_B:',JSON.stringify({allowed:auth.allowed,verdict:auth.verdict,rules_version:auth.rules_version,assignment_version:auth.assignment_version,disclosure_version:auth.disclosure_version}));
 if(auth.verdict==='PENDING'&&auth.allowed!==false)
  throw Error('Pending Reviewer B must not be authorized');
 if(auth.allowed===true&&auth.verdict!=='ELIGIBLE')
  throw Error('Reviewer B has authorization without ELIGIBLE verdict');
 if(disclosure.version===2 && assessment.disclosure_version===2 && assessment.rules_version===1) {
  if(assessment.verdict!=='ELIGIBLE')throw Error('Reviewer B expected ELIGIBLE on signed disclosure v2');
  if(auth.verdict!=='ELIGIBLE')throw Error('Reviewer B eligibility response mismatch');
  if(state.submitted_receipts===0 && auth.allowed!==true)
   throw Error('Eligible Reviewer B must be able to submit until receipt');
  console.log('ELIGIBLE_V2_CONSENSUS_PASS');
  if(state.submitted_receipts===0)console.log('ELIGIBLE_V2_AUTHORIZED_PASS');
 }

}
if(state.submitted_receipts>=1) {
 const reviewerB='0xD6b8A3A5eB329410D9504784812b8569afA8C2aF';
 const raw=await client.readContract({address,functionName:'receipt_for',args:[1,reviewerB],
  transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 if(!raw)throw Error('Reviewer B signed receipt missing');
 const receipt=typeof raw==='string'?JSON.parse(raw):raw;
 const byIdRaw=await client.readContract({address,functionName:'get_receipt',args:[1],
  transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const byId=typeof byIdRaw==='string'?JSON.parse(byIdRaw):byIdRaw;
 const expectedHash='9f3ea69857f2e5ff38644486092de964a96e7678ac127bf4a6537f9e873e545a';
 if(receipt.id!==1||receipt.review_id!==1||receipt.reviewer?.toLowerCase()!==reviewerB.toLowerCase()||
   receipt.status!=='SIGNED_REVIEW_SUBMITTED'||receipt.verdict!=='ELIGIBLE'||
   receipt.rules_version!==1||receipt.assignment_version!==1||receipt.disclosure_version!==2||
   receipt.review_sha256!==expectedHash||hash(receipt.review_text)!==expectedHash)
  throw Error('Reviewer B signed receipt mismatch');
 if(JSON.stringify(byId)!==JSON.stringify(receipt))throw Error('Receipt lookup mismatch');
 const authRaw=await client.readContract({address,functionName:'authorization',args:[1,reviewerB],
  transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const auth=typeof authRaw==='string'?JSON.parse(authRaw):authRaw;
 if(auth.receipt_id!==1||auth.allowed!==false||auth.verdict!=='ELIGIBLE')
  throw Error('Reviewer B replay protection not active after receipt');
 console.log('LATEST_FINAL_SIGNED_RECEIPT_B:',JSON.stringify({id:receipt.id,review_id:receipt.review_id,
  reviewer:receipt.reviewer,status:receipt.status,verdict:receipt.verdict,review_sha256:receipt.review_sha256,
  rules_version:receipt.rules_version,assignment_version:receipt.assignment_version,disclosure_version:receipt.disclosure_version}));
 console.log('RECEIPT_BY_ID_MATCH_PASS');
 console.log('REVIEWER_B_REPLAY_PROTECTION_STATE_PASS:',JSON.stringify({allowed:auth.allowed,receipt_id:auth.receipt_id}));
}
console.log('DISCLOSEGUARD_DEPLOYMENT_PREFLIGHT_PASS');
