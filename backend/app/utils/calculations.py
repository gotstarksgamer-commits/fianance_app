from typing import List

# Utility Functions (keep existing ones)
def calculate_emi(principal: float, rate: float, tenure: int) -> dict:
    """Calculate EMI and related values"""
    monthly_rate = rate / (12 * 100)
    
    if monthly_rate == 0:
        emi = principal / tenure
    else:
        emi = principal * monthly_rate * (1 + monthly_rate)**tenure / ((1 + monthly_rate)**tenure - 1)
    
    total_amount = emi * tenure
    total_interest = total_amount - principal
    
    return {
        "emi_amount": round(emi, 2),
        "total_interest": round(total_interest, 2),
        "total_amount": round(total_amount, 2)
    }

def generate_amortization_schedule(principal: float, rate: float, tenure: int, emi: float) -> List[dict]:
    """Generate detailed amortization schedule"""
    schedule = []
    remaining_principal = principal
    monthly_rate = rate / (12 * 100)
    
    for month in range(1, tenure + 1):
        interest_payment = remaining_principal * monthly_rate
        principal_payment = emi - interest_payment
        remaining_principal -= principal_payment
        
        if remaining_principal < 0:
            principal_payment += remaining_principal
            remaining_principal = 0
            
        schedule.append({
            "month": month,
            "emi": round(emi, 2),
            "principal_payment": round(principal_payment, 2),
            "interest_payment": round(interest_payment, 2),
            "remaining_principal": round(max(0, remaining_principal), 2)
        })
        
        if remaining_principal <= 0:
            break
    
    return schedule

def extract_recommendations_from_analysis(analysis_text: str) -> List[str]:
    """Extract actionable recommendations from AI analysis"""
    recommendations = []
    lines = analysis_text.split('\n')
    
    # Look for numbered recommendations or bullet points
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for recommendations patterns
        recommendation_keywords = [
            'recommend', 'suggest', 'should', 'consider', 'try', 'start',
            'focus on', 'prioritize', 'invest in', 'save', 'reduce', 'increase'
        ]
        
        # Check if line contains recommendation keywords
        if any(keyword in line.lower() for keyword in recommendation_keywords):
            # Clean up the line
            if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•', '*')):
                line = line[2:].strip()
            elif line.startswith(('**', '__')):
                # Extract text from markdown formatting
                import re
                line = re.sub(r'\*\*(.*?)\*\*', r'\1', line)
                line = re.sub(r'__(.*?)__', r'\1', line)
            
            if len(line) > 20 and len(recommendations) < 5:
                recommendations.append(line)
    
    # If no recommendations found, try to extract from numbered lists
    if not recommendations:
        import re
        numbered_pattern = r'^\d+\.\s*(.*)'
        for line in lines:
            match = re.match(numbered_pattern, line.strip())
            if match and len(recommendations) < 5:
                recommendation = match.group(1).strip()
                if len(recommendation) > 20:
                    recommendations.append(recommendation)
    
    # Fallback: provide generic recommendations
    if not recommendations:
        recommendations = [
            "Review and optimize your monthly budget allocation",
            "Build an emergency fund covering 6-12 months of expenses",
            "Consider investing in diversified mutual funds through SIPs",
            "Maximize tax-saving investments under Section 80C",
            "Regularly monitor and adjust your financial goals"
        ]
    
    return recommendations[:5]