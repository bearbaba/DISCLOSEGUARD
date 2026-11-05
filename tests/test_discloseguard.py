"""Offline state and authorization tests against a minimal mocked GenLayer runtime."""
import hashlib
import importlib.util
import json
import pathlib
import sys
import types
import unittest

CHAIR = "0x" + "1" * 40
A = "0x" + "2" * 40
B = "0x" + "3" * 40

class Address:
    def __init__(self, value):
        self.as_hex = value.lower()

class Return:
    def __init__(self, value):
        self.calldata = value

class MockContract:
    def __new__(cls, *args, **kwargs):
        instance = super().__new__(cls)
        for name, kind in cls.__annotations__.items():
            if getattr(kind, "__origin__", None) is dict:
                setattr(instance, name, {})
        return instance

class Runtime:
    def __init__(self):
        self.answer = "ELIGIBLE"
        self.sequence = None
        self.calls = 0
        self.message = types.SimpleNamespace(sender_address=types.SimpleNamespace(as_hex=CHAIR))
        self.vm = types.SimpleNamespace(UserError=ValueError, Return=Return,
                                        run_nondet_unsafe=self.agree)
        self.nondet = types.SimpleNamespace(exec_prompt=self.exec_prompt)
        self.public = types.SimpleNamespace(write=lambda f: f, view=lambda f: f)
        self.Contract = MockContract

    def exec_prompt(self, prompt):
        if self.sequence:
            result = self.sequence[self.calls % len(self.sequence)]
            self.calls += 1
            return result
        return self.answer

    def agree(self, leader, validator):
        verdict = leader()
        if not validator(Return(verdict)):
            raise ValueError("simulated consensus disagreement")
        return verdict

runtime = Runtime()
stub = types.ModuleType("genlayer")
stub.gl = runtime
stub.TreeMap = dict
stub.u256 = int
stub.Address = Address
sys.modules["genlayer"] = stub
spec = importlib.util.spec_from_file_location("discloseguard", pathlib.Path(__file__).parents[1] / "contracts/discloseguard.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

SUBJECT = ("Project Cedar has applied to Grant Round Alpha to fund an open-source data indexing product. "
           "The committee will review technical merit and applicant conflicts.")
RULES = ("Reviewers must recuse for paid employment, consulting, ownership or advisory ties to Project Cedar. "
         "Each assigned reviewer must provide a specific declaration addressing these ties, including a reference. "
         "Missing or ambiguous relationship disclosures require a manual review.")
RULES2 = RULES + " Reviewers must also disclose immediate-family investments in this applicant."
CLEAR = ("I have never received compensation, equity, employment or consulting payments from Project Cedar "
         "and have not served as an adviser, contractor or owner to this applicant.")
CONFLICT = ("I currently receive payment for product advice delivered to Project Cedar and continue "
            "to serve as a consulting adviser to the applicant.")
EVIDENCE = "Self-declared conflict statement, synthetic fixture"
REVIEW = ("The committee should examine the project's technical merits and code reproducibility. "
          "This review evaluates the declared applicant's demonstration, documentation and maintainability.")

class DiscloseGuardTests(unittest.TestCase):
    def setUp(self):
        runtime.message.sender_address.as_hex = CHAIR
        runtime.answer = "ELIGIBLE"
        runtime.sequence = None
        runtime.calls = 0
        self.c = module.DiscloseGuard()
        self.rid = self.c.create_review("Project Cedar review", SUBJECT, RULES)
        self.c.assign_reviewer(self.rid, A)
        self.c.assign_reviewer(self.rid, B)

    def actor(self, address):
        runtime.message.sender_address.as_hex = address

    def disclose(self, address, statement=CLEAR):
        self.actor(address)
        return self.c.submit_disclosure(self.rid, statement, EVIDENCE)

    def assess(self, address, outcome="ELIGIBLE"):
        self.actor(CHAIR)
        runtime.answer = outcome
        return self.c.assess_conflict(self.rid, address)

    def allowed(self, address):
        return json.loads(self.c.authorization(self.rid, address))["allowed"]

    def test_eligible_one_time_signed_review(self):
        self.disclose(B)
        self.assertEqual(self.assess(B), "ELIGIBLE")
        self.assertTrue(self.allowed(B))
        self.actor(B)
        checksum = hashlib.sha256(REVIEW.encode()).hexdigest()
        receipt = self.c.submit_review(self.rid, REVIEW, checksum)
        self.assertEqual(receipt, 1)
        self.assertFalse(self.allowed(B))
        data = json.loads(self.c.receipt_for(self.rid, B))
        self.assertEqual(data["status"], "SIGNED_REVIEW_SUBMITTED")
        with self.assertRaises(ValueError):
            self.c.submit_review(self.rid, REVIEW, checksum)

    def test_recusal_and_manual_review_fail_closed(self):
        self.disclose(A, CONFLICT)
        self.assertEqual(self.assess(A, "RECUSE"), "RECUSE")
        self.assertFalse(self.allowed(A))
        self.actor(A)
        with self.assertRaises(ValueError):
            self.c.submit_review(self.rid, REVIEW, hashlib.sha256(REVIEW.encode()).hexdigest())
        self.disclose(B, "I worked with some of the people around this applicant, but I am not certain whether I have current ties.")
        self.assertEqual(self.assess(B, "REVIEW_REQUIRED"), "REVIEW_REQUIRED")
        self.assertFalse(self.allowed(B))

    def test_disclosure_update_invalidates_assessment(self):
        self.disclose(B)
        self.assess(B)
        self.assertTrue(self.allowed(B))
        self.disclose(B, CLEAR + " This includes the current grant review period.")
        self.assertFalse(self.allowed(B))
        self.assess(B)
        self.assertTrue(self.allowed(B))

    def test_rules_update_and_revocation_invalidate(self):
        self.disclose(A)
        self.assess(A)
        self.assertTrue(self.allowed(A))
        self.actor(CHAIR)
        self.assertEqual(self.c.update_rules(self.rid, RULES2), 2)
        self.assertFalse(self.allowed(A))
        self.assess(A)
        self.assertTrue(self.allowed(A))
        self.actor(CHAIR)
        self.c.revoke_reviewer(self.rid, A)
        self.assertFalse(self.allowed(A))
        with self.assertRaises(ValueError):
            self.c.assess_conflict(self.rid, A)

    def test_signer_and_digest_integrity(self):
        self.actor(A)
        with self.assertRaisesRegex(ValueError, "chair only"):
            self.c.assign_reviewer(self.rid, B)
        self.disclose(B)
        self.assess(B)
        self.actor(A)
        with self.assertRaises(ValueError):
            self.c.submit_review(self.rid, REVIEW, hashlib.sha256(REVIEW.encode()).hexdigest())
        self.actor(B)
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            self.c.submit_review(self.rid, REVIEW, "0" * 64)

    def test_validator_disagreement_never_authorizes(self):
        self.disclose(B)
        self.actor(CHAIR)
        runtime.sequence = ["ELIGIBLE", "RECUSE"]
        runtime.calls = 0
        with self.assertRaisesRegex(ValueError, "consensus disagreement"):
            self.c.assess_conflict(self.rid, B)
        self.assertEqual(self.c.get_assessment(self.rid, B), "")
        self.assertFalse(self.allowed(B))

    def test_reassignment_requires_fresh_disclosure(self):
        self.disclose(B)
        self.assess(B)
        self.assertTrue(self.allowed(B))
        self.actor(CHAIR)
        self.c.revoke_reviewer(self.rid, B)
        self.c.assign_reviewer(self.rid, B)
        self.assertFalse(self.allowed(B))
        with self.assertRaisesRegex(ValueError, "outdated"):
            self.c.assess_conflict(self.rid, B)
        self.disclose(B, CLEAR + " This disclosure supersedes my prior signed statement.")
        self.assess(B)
        self.assertTrue(self.allowed(B))

    def test_closed_case_and_historical_receipt(self):
        self.disclose(B)
        self.assess(B)
        self.actor(B)
        checksum = hashlib.sha256(REVIEW.encode()).hexdigest()
        self.c.submit_review(self.rid, REVIEW, checksum)
        self.actor(CHAIR)
        self.c.close_review(self.rid)
        self.assertFalse(self.allowed(B))
        self.assertEqual(json.loads(self.c.get_receipt(1))["review_sha256"], checksum)
        self.assertEqual(json.loads(self.c.get_review(self.rid))["active"], False)

if __name__ == "__main__":
    unittest.main()
