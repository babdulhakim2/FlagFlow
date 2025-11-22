#!/usr/bin/env python3
"""Execute AML case analysis inline"""

from pattern_detection import AdvancedPatternDetector
from datetime import datetime

# Initialize pattern detector
detector = AdvancedPatternDetector()

# Transaction data for case aml_1763768300011
transaction_data = {
    'case_id': 'aml_1763768300011',
    'amount': 50000,
    'transaction_type': 'wire_transfer',
    'to_jurisdiction_risk': 'high',
    'bitcoin_wallet': 'bc1q6v56da8y8nhrh8lpfuy8cpk9g27g4gxgkce0aj',
    'context': 'third_party_initiated',
    'crypto_exchange_type': 'off_ramp',
    'wallet_type': 'personal_wallet',
    'stated_purpose': 'charitable donation',
    'customer_experience': 'first_time',
    'claimed_experience': 'first_time',
    'initiation_type': 'third_party'
}

# Run analysis
transaction_patterns = detector.analyze_transaction_patterns(transaction_data)
behavioral_patterns = detector.assess_behavioral_patterns(transaction_data)
network_patterns = detector.detect_network_patterns(transaction_data)
typology_scores = detector.score_against_typologies(transaction_data)

all_analysis = {
    'transactional_patterns': transaction_patterns,
    'behavioral_patterns': behavioral_patterns,
    'network_patterns': network_patterns,
    'typology_scores': typology_scores
}

risk_assessment = detector.calculate_comprehensive_risk_score(all_analysis)

print("AML PATTERN DETECTION ANALYSIS COMPLETE")
print(f"Overall Risk Score: {risk_assessment['overall_risk_score']}")
print(f"Risk Level: {risk_assessment['risk_level']}")
print(f"SAR Recommendation: {risk_assessment['sar_filing_recommendation']}")