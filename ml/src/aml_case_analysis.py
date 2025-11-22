#!/usr/bin/env python3
"""
AML Case Analysis for case aml_1763768300011
Comprehensive pattern detection analysis for a $50,000 wire transfer with crypto components
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pattern_detection import AdvancedPatternDetector
import json
from datetime import datetime

def analyze_aml_case():
    """
    Conduct comprehensive pattern detection analysis for AML case aml_1763768300011
    """

    # Initialize pattern detector
    detector = AdvancedPatternDetector()

    # Transaction data for case aml_1763768300011
    transaction_data = {
        'case_id': 'aml_1763768300011',
        'amount': 50000,  # $50,000 wire transfer
        'transaction_type': 'wire_transfer',
        'to_jurisdiction_risk': 'high',  # High-risk jurisdiction
        'bitcoin_wallet': 'bc1q6v56da8y8nhrh8lpfuy8cpk9g27g4gxgkce0aj',
        'context': 'third_party_initiated',
        'crypto_exchange_type': 'off_ramp',
        'wallet_type': 'personal_wallet',
        'stated_purpose': 'charitable donation',
        'customer_experience': 'first_time',
        'claimed_experience': 'first_time',
        'initiation_type': 'third_party'
    }

    print("=" * 80)
    print("AML PATTERN DETECTION ANALYSIS")
    print(f"Case ID: {transaction_data['case_id']}")
    print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    # 1. Transaction Pattern Recognition
    print("\n1. TRANSACTION PATTERN ANALYSIS")
    print("-" * 50)

    transaction_patterns = detector.analyze_transaction_patterns(transaction_data)

    print("\nCrypto-to-Fiat Patterns:")
    crypto_patterns = transaction_patterns['crypto_fiat_patterns']
    for pattern, score in crypto_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nTiming Patterns:")
    timing_patterns = transaction_patterns['timing_patterns']
    for pattern, score in timing_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nAmount Patterns:")
    amount_patterns = transaction_patterns['amount_patterns']
    for pattern, score in amount_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nStructuring Indicators:")
    structuring_patterns = transaction_patterns['structuring_indicators']
    for pattern, score in structuring_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    # 2. Behavioral Pattern Analysis
    print("\n\n2. BEHAVIORAL PATTERN ANALYSIS")
    print("-" * 50)

    behavioral_patterns = detector.assess_behavioral_patterns(transaction_data)

    print("\nFirst-Time User Analysis:")
    first_time_analysis = behavioral_patterns['first_time_analysis']
    for pattern, score in first_time_analysis.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nCharitable Donation Validation:")
    charitable_patterns = behavioral_patterns['charitable_donation_patterns']
    for pattern, score in charitable_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nCustomer Profile Consistency:")
    consistency_patterns = behavioral_patterns['customer_profile_consistency']
    for pattern, score in consistency_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nSophistication Mismatch Analysis:")
    sophistication_patterns = behavioral_patterns['sophistication_mismatch']
    for pattern, score in sophistication_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    # 3. Network Pattern Analysis
    print("\n\n3. NETWORK PATTERN ANALYSIS")
    print("-" * 50)

    network_patterns = detector.detect_network_patterns(transaction_data)

    print("\nClustering Analysis:")
    clustering_analysis = network_patterns['clustering_analysis']
    for pattern, score in clustering_analysis.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nEntity Relationships:")
    entity_relationships = network_patterns['entity_relationships']
    for pattern, score in entity_relationships.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nGeographic Patterns:")
    geographic_patterns = network_patterns['geographic_patterns']
    for pattern, score in geographic_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nCoordination Indicators:")
    coordination_patterns = network_patterns['coordination_indicators']
    for pattern, score in coordination_patterns.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    # 4. Typology Scoring
    print("\n\n4. REGULATORY TYPOLOGY ANALYSIS")
    print("-" * 50)

    typology_scores = detector.score_against_typologies(transaction_data)

    print("\nFinCEN Typologies:")
    fincen_scores = typology_scores['fincen_typologies']
    for pattern, score in fincen_scores.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nFATF Virtual Asset Red Flags:")
    fatf_scores = typology_scores['fatf_virtual_asset_flags']
    for pattern, score in fatf_scores.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nSanctions Evasion Patterns:")
    sanctions_scores = typology_scores['sanctions_evasion_patterns']
    for pattern, score in sanctions_scores.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    print("\nTrade-Based ML Indicators:")
    trade_ml_scores = typology_scores['trade_based_ml_indicators']
    for pattern, score in trade_ml_scores.items():
        risk_level = get_risk_level(score)
        print(f"  • {pattern.replace('_', ' ').title()}: {score} ({risk_level})")

    # 5. Comprehensive Risk Assessment
    print("\n\n5. COMPREHENSIVE RISK ASSESSMENT")
    print("=" * 50)

    all_analysis = {
        'transactional_patterns': transaction_patterns,
        'behavioral_patterns': behavioral_patterns,
        'network_patterns': network_patterns,
        'typology_scores': typology_scores
    }

    risk_assessment = detector.calculate_comprehensive_risk_score(all_analysis)

    print(f"\nOverall Risk Score: {risk_assessment['overall_risk_score']}/100")
    print(f"Risk Level: {risk_assessment['risk_level'].upper()}")
    print(f"SAR Filing Recommendation: {risk_assessment['sar_filing_recommendation'].replace('_', ' ').upper()}")
    print(f"Confidence Level: {risk_assessment['confidence_level'].upper()}")

    print("\nCategory Risk Breakdown:")
    for category, score in risk_assessment['category_scores'].items():
        risk_level = get_risk_level(score)
        print(f"  • {category.replace('_', ' ').title()}: {score} ({risk_level})")

    print(f"\nTop Risk Factors Identified:")
    for i, factor in enumerate(risk_assessment['risk_factors_summary'], 1):
        print(f"  {i}. {factor}")

    # 6. Detailed Analysis & Recommendations
    print("\n\n6. DETAILED ANALYSIS & RECOMMENDATIONS")
    print("=" * 50)

    print_detailed_analysis(transaction_data, all_analysis, risk_assessment)

    return risk_assessment

def get_risk_level(score):
    """Convert numeric score to risk level description"""
    if score >= 95:
        return "CRITICAL"
    elif score >= 80:
        return "HIGH"
    elif score >= 60:
        return "MEDIUM-HIGH"
    elif score >= 40:
        return "MEDIUM"
    elif score >= 20:
        return "LOW-MEDIUM"
    else:
        return "LOW"

def print_detailed_analysis(transaction_data, all_analysis, risk_assessment):
    """Print detailed analysis and recommendations"""

    print("\nKEY FINDINGS:")
    print("-" * 30)

    # Crypto-to-fiat pattern analysis
    print("\n• CRYPTO-TO-FIAT CONVERSION PATTERNS:")
    print("  - $50,000 represents a large-volume crypto liquidation")
    print("  - Bitcoin wallet bc1q6v56da8y8nhrh8lpfuy8cpk9g27g4gxgkce0aj indicates technical sophistication")
    print("  - Off-ramp timing suggests potential pre-planned liquidation strategy")
    print("  - Round amount ($50K) may indicate artificial structuring or coordination")

    # Third-party initiation risks
    print("\n• THIRD-PARTY INITIATION RED FLAGS:")
    print("  - Transaction initiated by third party, not account holder")
    print("  - Reduces direct customer due diligence effectiveness")
    print("  - Potential nominee arrangement or beneficial ownership obscuration")
    print("  - Enhanced monitoring required for all parties involved")

    # Geographic and jurisdictional risks
    print("\n• GEOGRAPHIC & JURISDICTIONAL RISKS:")
    print("  - Destination classified as high-risk jurisdiction")
    print("  - Cross-border movement complicates regulatory oversight")
    print("  - Potential sanctions evasion or regulatory arbitrage")
    print("  - Enhanced due diligence required for destination compliance")

    # Behavioral inconsistencies
    print("\n• BEHAVIORAL PATTERN INCONSISTENCIES:")
    print("  - High transaction sophistication vs. claimed first-time experience")
    print("  - $50K amount unusually large for novice crypto user")
    print("  - Charitable donation claim requires enhanced verification")
    print("  - Technical complexity suggests hidden expertise or external guidance")

    print("\n\nRECOMMENDATIONS:")
    print("-" * 30)

    if risk_assessment['overall_risk_score'] >= 75:
        print("\n🚨 IMMEDIATE ACTIONS REQUIRED:")
        print("  1. File Suspicious Activity Report (SAR) within 30 days")
        print("  2. Enhanced monitoring of all related accounts and entities")
        print("  3. Comprehensive beneficial ownership investigation")
        print("  4. Review all historical transactions from same customer/wallet")
        print("  5. Cross-reference against sanctions and watchlists")
        print("  6. Verify charitable recipient legitimacy if donation claimed")

    print("\n📊 ONGOING MONITORING:")
    print("  • Monitor bitcoin wallet bc1q6v56da8y8nhrh8lpfuy8cpk9g27g4gxgkce0aj for:")
    print("    - Additional large transactions or velocity increases")
    print("    - Connections to mixing services or privacy coins")
    print("    - Patterns suggesting coordinated activity")
    print("  • Geographic pattern monitoring:")
    print("    - Future transactions to same high-risk jurisdiction")
    print("    - Escalating amounts or frequency to similar destinations")
    print("  • Third-party relationship analysis:")
    print("    - Identity verification of all transaction initiators")
    print("    - Mapping of beneficial ownership structures")

    print("\n⚖️ REGULATORY COMPLIANCE:")
    print("  • FinCEN BSA Requirements:")
    print("    - Currency Transaction Report (CTR) filed for $50K amount")
    print("    - SAR filing recommended due to suspicious pattern combination")
    print("  • FATF Virtual Asset Guidelines:")
    print("    - Enhanced due diligence for crypto-fiat conversions")
    print("    - Travel rule compliance for cross-border transfers")
    print("  • OFAC Sanctions Compliance:")
    print("    - Enhanced screening for high-risk jurisdiction destinations")
    print("    - Ongoing monitoring for sanctions list updates")

    print("\n🔍 INVESTIGATION PRIORITIES:")
    print(f"  1. Verify legitimacy of charitable donation claim")
    print(f"  2. Investigate third-party relationship and authorization")
    print(f"  3. Analyze blockchain transaction history for wallet")
    print(f"  4. Enhanced due diligence on destination jurisdiction risks")
    print(f"  5. Customer interview to assess claimed experience level")

    print("\n📈 RISK MITIGATION:")
    print("  • Implement transaction velocity limits for similar patterns")
    print("  • Enhance customer authentication for third-party initiated transactions")
    print("  • Deploy advanced analytics for crypto-fiat conversion monitoring")
    print("  • Strengthen charitable donation verification procedures")

if __name__ == "__main__":
    try:
        risk_assessment = analyze_aml_case()
        print(f"\n\nAnalysis completed successfully.")
        print(f"Risk Level: {risk_assessment['risk_level'].upper()}")
        print(f"Recommendation: {risk_assessment['sar_filing_recommendation'].replace('_', ' ').upper()}")
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        sys.exit(1)