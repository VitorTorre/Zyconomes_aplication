export const safeNumber = (val: number) => (isNaN(val) || !isFinite(val) ? 0 : val);

export const calculateSavingsRate = (income: number, expenses: number) => {
  const freeCashFlow = income - expenses;
  return income > 0 ? (freeCashFlow / income) * 100 : 0;
};

export const calculateEmergencyFundMonths = (savings: number, expenses: number) => {
  return expenses > 0 ? savings / expenses : 0;
};

export const calculateIndependenceYears = (currentWealth: number, targetWealth: number, monthlyContribution: number, annualRate: number) => {
  const monthlyRate = annualRate / 100 / 12;
  const remainingMonths = monthlyRate > 0 && monthlyContribution > 0
    ? Math.log(((targetWealth * monthlyRate) + monthlyContribution) / ((currentWealth * monthlyRate) + monthlyContribution)) / Math.log(1 + monthlyRate)
    : (targetWealth - currentWealth) / (monthlyContribution || 1);
  return safeNumber(remainingMonths / 12);
};
