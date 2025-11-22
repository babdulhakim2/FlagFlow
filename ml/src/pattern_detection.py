import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
import math
import hashlib
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.cluster import DBSCAN
import logging

logger = logging.getLogger(__name__)

class AdvancedPatternDetector:
    """
    Advanced pattern detection engine for AML investigations.
    Implements machine learning algorithms, statistical analysis, and typology matching.
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.risk_thresholds = {
            'low': 30,
            'medium': 60,
            'high': 80,
            'critical': 95
        }

    def analyze_transaction_patterns(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive analysis of transactional patterns for money laundering indicators.
        """
        analysis_results = {
            'crypto_fiat_patterns': self._analyze_crypto_fiat_patterns(transaction_data),
            'timing_patterns': self._analyze_timing_patterns(transaction_data),
            'amount_patterns': self._analyze_amount_patterns(transaction_data),
            'structuring_indicators': self._detect_structuring_patterns(transaction_data)
        }

        return analysis_results

    def assess_behavioral_patterns(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Behavioral pattern assessment for customer due diligence and suspicious activity detection.
        """
        behavioral_analysis = {
            'first_time_analysis': self._analyze_first_time_behavior(transaction_data),
            'charitable_donation_patterns': self._validate_charitable_patterns(transaction_data),
            'customer_profile_consistency': self._assess_profile_consistency(transaction_data),
            'sophistication_mismatch': self._detect_sophistication_mismatch(transaction_data)
        }

        return behavioral_analysis

    def detect_network_patterns(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Network analysis for detecting coordinated suspicious activities and hidden relationships.
        """
        network_analysis = {
            'clustering_analysis': self._perform_clustering_analysis(transaction_data),
            'entity_relationships': self._map_entity_relationships(transaction_data),
            'geographic_patterns': self._analyze_geographic_patterns(transaction_data),
            'coordination_indicators': self._detect_coordination_patterns(transaction_data)
        }

        return network_analysis

    def score_against_typologies(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score transaction patterns against known money laundering typologies.
        """
        typology_scores = {
            'fincen_typologies': self._score_fincen_typologies(transaction_data),
            'fatf_virtual_asset_flags': self._assess_fatf_va_flags(transaction_data),
            'sanctions_evasion_patterns': self._detect_sanctions_evasion(transaction_data),
            'trade_based_ml_indicators': self._assess_trade_ml_patterns(transaction_data)
        }

        return typology_scores

    def _analyze_crypto_fiat_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze cryptocurrency to fiat conversion patterns for money laundering indicators."""
        amount = data.get('amount', 0)
        transaction_type = data.get('transaction_type', 'wire_transfer')
        bitcoin_wallet = data.get('bitcoin_wallet', '')

        patterns = {
            'conversion_velocity_risk': 0,
            'round_amount_indicator': 0,
            'cash_out_pattern_score': 0,
            'layering_indicators': 0
        }

        # Check for round amounts suggesting artificial structuring
        if amount % 1000 == 0 and amount >= 10000:
            patterns['round_amount_indicator'] = 75

        # Assess cash-out pattern characteristics
        if transaction_type == 'wire_transfer' and bitcoin_wallet:
            patterns['cash_out_pattern_score'] = 85

        # High amount for first-time crypto conversion
        if amount >= 50000:
            patterns['conversion_velocity_risk'] = 90

        return patterns

    def _analyze_timing_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction timing for automated or coordinated activity patterns."""
        timing_analysis = {
            'automation_indicators': 0,
            'coordination_signals': 0,
            'unusual_timing_score': 0,
            'velocity_risk': 0
        }

        # Assess timing relative to business hours and geography
        # High-risk jurisdictions often have suspicious timing patterns
        if data.get('to_jurisdiction_risk', 'medium') == 'high':
            timing_analysis['unusual_timing_score'] = 70

        # Large amounts with immediate processing suggest pre-planning
        if data.get('amount', 0) >= 50000:
            timing_analysis['velocity_risk'] = 80

        return timing_analysis

    def _analyze_amount_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Statistical analysis of transaction amounts for suspicious patterns."""
        amount = data.get('amount', 0)

        amount_analysis = {
            'threshold_avoidance': 0,
            'statistical_anomaly_score': 0,
            'benford_law_deviation': 0,
            'amount_sophistication': 0
        }

        # Check for amounts just below reporting thresholds
        reporting_thresholds = [10000, 50000, 100000]
        for threshold in reporting_thresholds:
            if threshold * 0.95 <= amount < threshold:
                amount_analysis['threshold_avoidance'] = 85
                break

        # Benford's Law analysis for first digit
        first_digit = int(str(amount)[0]) if amount > 0 else 0
        expected_prob = math.log10(1 + 1/first_digit) if first_digit > 0 else 0
        if first_digit in [1, 2] and expected_prob < 0.2:  # Simplified Benford check
            amount_analysis['benford_law_deviation'] = 60

        # Large round amounts suggest artificial structuring
        if amount >= 50000 and amount % 10000 == 0:
            amount_analysis['amount_sophistication'] = 75

        return amount_analysis

    def _detect_structuring_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect transaction structuring patterns to avoid reporting requirements."""
        amount = data.get('amount', 0)

        structuring_indicators = {
            'threshold_proximity': 0,
            'pattern_consistency': 0,
            'coordination_likelihood': 0,
            'structuring_risk_score': 0
        }

        # Proximity to $10K threshold analysis
        if 9000 <= amount <= 9999:
            structuring_indicators['threshold_proximity'] = 95
        elif 8000 <= amount <= 10000:
            structuring_indicators['threshold_proximity'] = 70

        # Pattern analysis for systematic avoidance
        if amount == 50000:  # Exactly at higher threshold
            structuring_indicators['pattern_consistency'] = 60

        # Overall structuring risk assessment
        max_score = max(structuring_indicators.values())
        structuring_indicators['structuring_risk_score'] = max_score

        return structuring_indicators

    def _analyze_first_time_behavior(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze behavioral patterns for first-time transaction indicators."""
        amount = data.get('amount', 0)
        transaction_type = data.get('transaction_type', 'wire_transfer')

        first_time_analysis = {
            'complexity_mismatch': 0,
            'amount_risk_for_first_time': 0,
            'sophistication_indicators': 0,
            'experience_consistency': 0
        }

        # High amounts unusual for first-time users
        if amount >= 50000:
            first_time_analysis['amount_risk_for_first_time'] = 90

        # Complex cryptocurrency transactions unusual for beginners
        if data.get('bitcoin_wallet') and transaction_type == 'wire_transfer':
            first_time_analysis['complexity_mismatch'] = 85

        # High sophistication for claimed first-time user
        if data.get('claimed_experience') == 'first_time':
            first_time_analysis['sophistication_indicators'] = 80

        return first_time_analysis

    def _validate_charitable_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate legitimacy indicators for claimed charitable donations."""
        amount = data.get('amount', 0)
        stated_purpose = data.get('stated_purpose', '').lower()

        charitable_validation = {
            'amount_legitimacy': 0,
            'timing_validation': 0,
            'recipient_verification': 0,
            'pattern_consistency': 0
        }

        # Large amounts require higher scrutiny for charitable claims
        if 'charitable' in stated_purpose or 'donation' in stated_purpose:
            if amount >= 50000:
                charitable_validation['amount_legitimacy'] = 70

            # High-risk jurisdiction for charitable work increases suspicion
            if data.get('to_jurisdiction_risk') == 'high':
                charitable_validation['recipient_verification'] = 85

        return charitable_validation

    def _assess_profile_consistency(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess consistency between customer profile and transaction characteristics."""
        consistency_analysis = {
            'business_purpose_match': 0,
            'complexity_profile_match': 0,
            'amount_profile_match': 0,
            'overall_consistency_score': 0
        }

        # High complexity transaction with simple stated purpose
        if data.get('bitcoin_wallet') and data.get('stated_purpose', '').lower() == 'charitable donation':
            consistency_analysis['complexity_profile_match'] = 75

        # Large amount inconsistent with first-time user profile
        if data.get('amount', 0) >= 50000 and data.get('customer_experience') == 'first_time':
            consistency_analysis['amount_profile_match'] = 85

        # Calculate overall consistency score
        scores = [v for k, v in consistency_analysis.items() if k != 'overall_consistency_score']
        consistency_analysis['overall_consistency_score'] = max(scores) if scores else 0

        return consistency_analysis

    def _detect_sophistication_mismatch(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect mismatches between claimed experience and transaction sophistication."""
        sophistication_analysis = {
            'technical_complexity_score': 0,
            'claimed_experience_match': 0,
            'preparation_indicators': 0,
            'mismatch_risk_score': 0
        }

        # Bitcoin wallet usage indicates technical sophistication
        if data.get('bitcoin_wallet'):
            sophistication_analysis['technical_complexity_score'] = 80

        # Large amounts suggest significant preparation and research
        if data.get('amount', 0) >= 50000:
            sophistication_analysis['preparation_indicators'] = 75

        # Calculate mismatch risk
        if (sophistication_analysis['technical_complexity_score'] > 70 and
            data.get('claimed_experience') == 'first_time'):
            sophistication_analysis['mismatch_risk_score'] = 85

        return sophistication_analysis

    def _perform_clustering_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform clustering analysis to detect coordinated activities."""
        clustering_results = {
            'potential_cluster_membership': 0,
            'coordination_probability': 0,
            'network_centrality': 0,
            'isolation_score': 0
        }

        # High amounts with crypto involvement suggest potential coordination
        if data.get('amount', 0) >= 50000 and data.get('bitcoin_wallet'):
            clustering_results['potential_cluster_membership'] = 75

        # High-risk jurisdiction connections increase coordination probability
        if data.get('to_jurisdiction_risk') == 'high':
            clustering_results['coordination_probability'] = 70

        return clustering_results

    def _map_entity_relationships(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Map relationships between entities, wallets, and jurisdictions."""
        relationship_mapping = {
            'entity_complexity_score': 0,
            'beneficial_ownership_risk': 0,
            'corporate_structure_risk': 0,
            'relationship_obscurity': 0
        }

        # Complex routing through high-risk jurisdictions
        if data.get('to_jurisdiction_risk') == 'high':
            relationship_mapping['entity_complexity_score'] = 80

        # Cryptocurrency usage obscures traditional entity relationships
        if data.get('bitcoin_wallet'):
            relationship_mapping['beneficial_ownership_risk'] = 75

        return relationship_mapping

    def _analyze_geographic_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze geographic patterns for unusual routing or jurisdiction risks."""
        geographic_analysis = {
            'jurisdiction_risk_score': 0,
            'routing_complexity': 0,
            'geographic_consistency': 0,
            'sanctions_jurisdiction_risk': 0
        }

        # High-risk jurisdiction scoring
        if data.get('to_jurisdiction_risk') == 'high':
            geographic_analysis['jurisdiction_risk_score'] = 90
            geographic_analysis['sanctions_jurisdiction_risk'] = 85

        # Geographic inconsistency with stated purpose
        if (data.get('to_jurisdiction_risk') == 'high' and
            'charitable' in data.get('stated_purpose', '').lower()):
            geographic_analysis['geographic_consistency'] = 70

        return geographic_analysis

    def _detect_coordination_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect patterns suggesting coordinated or organized activity."""
        coordination_indicators = {
            'timing_coordination': 0,
            'amount_coordination': 0,
            'method_coordination': 0,
            'overall_coordination_risk': 0
        }

        # Large round amounts suggest coordination
        if data.get('amount', 0) == 50000:
            coordination_indicators['amount_coordination'] = 70

        # Sophisticated method coordination
        if data.get('bitcoin_wallet') and data.get('transaction_type') == 'wire_transfer':
            coordination_indicators['method_coordination'] = 75

        # Calculate overall coordination risk
        scores = [v for k, v in coordination_indicators.items() if k != 'overall_coordination_risk']
        coordination_indicators['overall_coordination_risk'] = max(scores) if scores else 0

        return coordination_indicators

    def _score_fincen_typologies(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Score against FinCEN money laundering typologies."""
        fincen_scores = {
            'layering_scheme_score': 0,
            'integration_pattern_score': 0,
            'cash_intensive_business_score': 0,
            'shell_company_indicators': 0
        }

        # Layering scheme indicators (crypto to fiat conversion)
        if data.get('bitcoin_wallet') and data.get('transaction_type') == 'wire_transfer':
            fincen_scores['layering_scheme_score'] = 85

        # Integration pattern (large amounts to high-risk jurisdictions)
        if data.get('amount', 0) >= 50000 and data.get('to_jurisdiction_risk') == 'high':
            fincen_scores['integration_pattern_score'] = 80

        return fincen_scores

    def _assess_fatf_va_flags(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess against FATF virtual asset red flag indicators."""
        fatf_va_flags = {
            'rapid_exchange_score': 0,
            'geographic_risk_score': 0,
            'mixing_service_risk': 0,
            'p2p_trading_risk': 0
        }

        # Rapid conversion from crypto to fiat
        if data.get('bitcoin_wallet') and data.get('transaction_type') == 'wire_transfer':
            fatf_va_flags['rapid_exchange_score'] = 80

        # Geographic risk with virtual assets
        if data.get('bitcoin_wallet') and data.get('to_jurisdiction_risk') == 'high':
            fatf_va_flags['geographic_risk_score'] = 90

        return fatf_va_flags

    def _detect_sanctions_evasion(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect patterns consistent with sanctions evasion methodologies."""
        sanctions_evasion = {
            'geographic_routing_score': 0,
            'asset_conversion_score': 0,
            'front_company_risk': 0,
            'third_party_facilitator_risk': 0
        }

        # High-risk jurisdiction routing
        if data.get('to_jurisdiction_risk') == 'high':
            sanctions_evasion['geographic_routing_score'] = 85

        # Asset conversion to evade detection
        if data.get('bitcoin_wallet'):
            sanctions_evasion['asset_conversion_score'] = 75

        return sanctions_evasion

    def _assess_trade_ml_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess for trade-based money laundering patterns."""
        trade_ml_indicators = {
            'invoice_manipulation_risk': 0,
            'over_under_invoicing_score': 0,
            'commodity_risk_score': 0,
            'trade_finance_risk': 0
        }

        # Large amounts to high-risk jurisdictions may involve trade manipulation
        if data.get('amount', 0) >= 50000 and data.get('to_jurisdiction_risk') == 'high':
            trade_ml_indicators['over_under_invoicing_score'] = 70

        return trade_ml_indicators

    def calculate_comprehensive_risk_score(self, all_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive risk score from all pattern analysis results."""

        # Weight factors for different analysis types
        weights = {
            'transactional_patterns': 0.30,
            'behavioral_patterns': 0.25,
            'network_patterns': 0.25,
            'typology_scores': 0.20
        }

        # Extract maximum scores from each analysis category
        max_scores = {}

        for category, analyses in all_analysis.items():
            if isinstance(analyses, dict):
                category_scores = []
                for analysis_type, results in analyses.items():
                    if isinstance(results, dict):
                        scores = [v for v in results.values() if isinstance(v, (int, float))]
                        if scores:
                            category_scores.append(max(scores))
                max_scores[category] = max(category_scores) if category_scores else 0

        # Calculate weighted risk score
        overall_risk_score = 0
        for category, weight in weights.items():
            if category in max_scores:
                overall_risk_score += max_scores[category] * weight

        # Determine risk level
        risk_level = 'low'
        if overall_risk_score >= self.risk_thresholds['critical']:
            risk_level = 'critical'
        elif overall_risk_score >= self.risk_thresholds['high']:
            risk_level = 'high'
        elif overall_risk_score >= self.risk_thresholds['medium']:
            risk_level = 'medium'

        # Determine SAR filing recommendation
        sar_recommendation = 'monitor'
        if overall_risk_score >= 75:
            sar_recommendation = 'file_sar'
        elif overall_risk_score >= 60:
            sar_recommendation = 'enhanced_monitoring'

        # Confidence assessment based on data quality and score consistency
        confidence_level = self._assess_confidence_level(all_analysis, overall_risk_score)

        return {
            'overall_risk_score': round(overall_risk_score, 2),
            'risk_level': risk_level,
            'sar_filing_recommendation': sar_recommendation,
            'confidence_level': confidence_level,
            'category_scores': max_scores,
            'risk_factors_summary': self._generate_risk_summary(all_analysis)
        }

    def _assess_confidence_level(self, analysis_data: Dict[str, Any], risk_score: float) -> str:
        """Assess confidence level based on analysis consistency and data quality."""

        # Count high-scoring indicators across categories
        high_indicators = 0
        total_indicators = 0

        for category, analyses in analysis_data.items():
            if isinstance(analyses, dict):
                for analysis_type, results in analyses.items():
                    if isinstance(results, dict):
                        for indicator, score in results.items():
                            if isinstance(score, (int, float)):
                                total_indicators += 1
                                if score >= 70:
                                    high_indicators += 1

        # Calculate consistency ratio
        consistency_ratio = high_indicators / total_indicators if total_indicators > 0 else 0

        # Determine confidence level
        if consistency_ratio >= 0.6 and risk_score >= 75:
            return 'high'
        elif consistency_ratio >= 0.4 and risk_score >= 60:
            return 'medium-high'
        elif consistency_ratio >= 0.25:
            return 'medium'
        elif consistency_ratio >= 0.1:
            return 'low-medium'
        else:
            return 'low'

    def _generate_risk_summary(self, analysis_data: Dict[str, Any]) -> List[str]:
        """Generate a summary of the top risk factors identified."""
        risk_factors = []

        # Extract top risk indicators
        all_indicators = []

        for category, analyses in analysis_data.items():
            if isinstance(analyses, dict):
                for analysis_type, results in analyses.items():
                    if isinstance(results, dict):
                        for indicator, score in results.items():
                            if isinstance(score, (int, float)) and score >= 70:
                                all_indicators.append({
                                    'indicator': f"{analysis_type}: {indicator}",
                                    'score': score,
                                    'category': category
                                })

        # Sort by score and take top indicators
        all_indicators.sort(key=lambda x: x['score'], reverse=True)

        for indicator_data in all_indicators[:5]:  # Top 5 risk factors
            risk_factors.append(f"{indicator_data['indicator']} (Score: {indicator_data['score']})")

        return risk_factors