import Papa from 'papaparse';

export const convertQuoteToService = (csvString: string) => {
  const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
  
  // Helper to turn RAED into Raed
  const toProperCase = (str: string) => {
    if (!str) return str;
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Helper to turn 5/14/2022 into 5/14/22
  const toShortDate = (dateStr: string) => {
    if (!dateStr) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2].slice(-2)}`;
    }
    return dateStr;
  };

  const mappedData = parsed.data.map((row: any) => ({
    "phone_number": `1${row.CustomerMobilePhone?.replace(/\D/g, '')}`,
    "Customer": toProperCase(row.CustomerFirstName),
    "Last Name": toProperCase(row.CustomerLastName),
    "Purchase Date": toShortDate(row.TradePurchaseDate),
    "Year": row.TradeYear?.toString().slice(-2),
    "Model": row.TradeModel,
    "VIN": row.TradeVIN,
    "Miles": row.TradeMileage,
    "Payoff": row.TradePayoff,
    "Payment": row.TradeMonthlyPayment
  }));

  return Papa.unparse(mappedData);
};