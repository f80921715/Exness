import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Supported Country Configurations & Bank Registries
interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  scheme: "paystack" | "us_ach" | "gb_sort" | "sepa_iban" | "ca_transit" | "au_bsb" | "in_ifsc" | "swift_iban";
  identifierLabel: string;
  secondaryLabel?: string;
  banks?: Array<{ name: string; code: string; bic?: string }>;
}

const SUPPORTED_COUNTRIES: Record<string, CountryConfig> = {
  US: {
    code: "US",
    name: "United States",
    currency: "USD",
    scheme: "us_ach",
    identifierLabel: "Account Number",
    secondaryLabel: "Routing Number (ABA 9-digit)",
    banks: [
      { name: "JPMorgan Chase Bank", code: "021000021" },
      { name: "Bank of America", code: "051000017" },
      { name: "Wells Fargo Bank", code: "121000249" },
      { name: "Citibank, N.A.", code: "021000089" },
      { name: "U.S. Bank", code: "091000022" },
      { name: "PNC Bank", code: "071921891" },
      { name: "Truist Bank", code: "061000104" },
      { name: "Goldman Sachs Bank USA", code: "021000047" },
      { name: "Capital One", code: "051405515" },
      { name: "TD Bank, N.A.", code: "031101266" },
      { name: "Charles Schwab Bank", code: "121202211" },
      { name: "Morgan Stanley Private Bank", code: "026013576" },
      { name: "BMO Harris Bank", code: "071000288" },
      { name: "Fifth Third Bank", code: "042000314" },
      { name: "Citizens Bank", code: "011000138" },
      { name: "KeyBank", code: "041001039" },
      { name: "Huntington National Bank", code: "044000024" },
      { name: "Ally Bank", code: "124003116" },
      { name: "Regions Bank", code: "062000019" },
      { name: "M&T Bank", code: "022000046" },
      { name: "Discover Bank", code: "031100649" },
      { name: "American Express National Bank", code: "124085066" },
      { name: "Navy Federal Credit Union", code: "256074974" },
      { name: "USAA Federal Savings Bank", code: "314074269" },
      { name: "Synchrony Bank", code: "071923909" },
      { name: "SoFi Bank, N.A.", code: "031101334" },
      { name: "Chime (The Bancorp Bank)", code: "031101279" },
      { name: "Mercury (Choice Financial Group)", code: "091311229" },
      { name: "Brex (Column N.A.)", code: "121145349" },
      { name: "First Horizon Bank", code: "084000026" },
      { name: "Western Alliance Bank", code: "122105155" },
      { name: "Comerica Bank", code: "111000753" },
      { name: "Zions Bancorporation", code: "124000054" },
    ],
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    scheme: "gb_sort",
    identifierLabel: "Account Number (8-digit)",
    secondaryLabel: "Sort Code (6-digit)",
    banks: [
      { name: "Barclays Bank UK", code: "20-00-00" },
      { name: "HSBC UK Bank", code: "40-00-00" },
      { name: "Lloyds Bank", code: "30-00-00" },
      { name: "NatWest (National Westminster)", code: "60-00-01" },
      { name: "Santander UK", code: "09-01-26" },
      { name: "Royal Bank of Scotland (RBS)", code: "83-04-25" },
      { name: "Standard Chartered Bank", code: "60-91-94" },
      { name: "Monzo Bank", code: "04-00-04" },
      { name: "Revolut Ltd", code: "04-00-75" },
      { name: "Starling Bank", code: "60-83-71" },
      { name: "Nationwide Building Society", code: "07-00-93" },
      { name: "TSB Bank", code: "77-00-01" },
      { name: "Virgin Money / Clydesdale Bank", code: "08-00-99" },
      { name: "Bank of Scotland", code: "80-00-00" },
      { name: "Halifax", code: "11-00-01" },
      { name: "Metro Bank", code: "23-05-80" },
      { name: "Co-operative Bank", code: "08-90-00" },
      { name: "Yorkshire Bank", code: "05-00-05" },
      { name: "Ulster Bank UK", code: "98-00-00" },
      { name: "Coutts & Co", code: "18-00-02" },
      { name: "Chase UK (JPMorgan)", code: "60-83-71" },
      { name: "Handelsbanken UK", code: "40-51-62" },
      { name: "Atom Bank", code: "08-32-10" },
      { name: "Al Rayan Bank", code: "60-95-93" },
      { name: "Shawbrook Bank", code: "16-57-10" },
      { name: "Aldermore Bank", code: "40-62-02" },
      { name: "Close Brothers", code: "60-00-00" },
      { name: "Tide / ClearBank", code: "04-06-05" },
      { name: "Wise UK", code: "23-14-70" },
    ],
  },
  DE: {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (International Bank Account Number)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "Deutsche Bank", code: "DEUTDEDD", bic: "DEUTDEDD" },
      { name: "Commerzbank", code: "COBADEFF", bic: "COBADEFF" },
      { name: "KfW Bank", code: "KFWDEDFF", bic: "KFWDEDFF" },
      { name: "DZ BANK", code: "GENODEDD", bic: "GENODEDD" },
      { name: "UniCredit Bank (HypoVereinsbank)", code: "HYVEDEMM", bic: "HYVEDEMM" },
      { name: "ING-DiBa", code: "INGDDEFF", bic: "INGDDEFF" },
      { name: "N26 Bank", code: "NTWODEDD", bic: "NTWODEDD" },
      { name: "DKB (Deutsche Kreditbank)", code: "BYLADEM1001", bic: "BYLADEM1001" },
      { name: "Berliner Sparkasse", code: "BELADED1BER", bic: "BELADED1BER" },
      { name: "Hamburger Sparkasse", code: "HASPDEHH", bic: "HASPDEHH" },
      { name: "Postbank (Deutsche Bank)", code: "PBNKDEFF", bic: "PBNKDEFF" },
      { name: "Landesbank Baden-Württemberg (LBBW)", code: "SOLADEST", bic: "SOLADEST" },
      { name: "BayernLB", code: "BYLADEMM", bic: "BYLADEMM" },
      { name: "Helaba (Landesbank Hessen-Thüringen)", code: "HELADEFF", bic: "HELADEFF" },
      { name: "Norddeutsche Landesbank (NORD/LB)", code: "NLADE2H", bic: "NLADE2H" },
      { name: "GLS Bank", code: "GENODED1GLS", bic: "GENODED1GLS" },
      { name: "Targobank", code: "CCBADEF1", bic: "CCBADEF1" },
      { name: "Consorsbank", code: "BNPADEDD", bic: "BNPADEDD" },
      { name: "Comdirect", code: "COBDDEDD", bic: "COBDDEDD" },
      { name: "Solarisbank", code: "SOLEDEDD", bic: "SOLEDEDD" },
      { name: "Triodos Bank Germany", code: "TRBODED1", bic: "TRBODED1" },
      { name: "Volkswagen Bank", code: "VOWBDE21", bic: "VOWBDE21" },
      { name: "Santander Consumer Bank Germany", code: "SCBEDE21", bic: "SCBEDE21" },
    ],
  },
  FR: {
    code: "FR",
    name: "France",
    currency: "EUR",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (International Bank Account Number)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "BNP Paribas", code: "BNPAFRPP", bic: "BNPAFRPP" },
      { name: "Crédit Agricole", code: "AGRIFRPP", bic: "AGRIFRPP" },
      { name: "Société Générale", code: "SOGEFRPP", bic: "SOGEFRPP" },
      { name: "Groupe BPCE", code: "CCBPFRPP", bic: "CCBPFRPP" },
      { name: "Banque Populaire", code: "BPCEFRPP", bic: "BPCEFRPP" },
      { name: "Caisse d'Épargne", code: "CEPAFRPP", bic: "CEPAFRPP" },
      { name: "Crédit Mutuel", code: "CMCIFR2A", bic: "CMCIFR2A" },
      { name: "CIC (Crédit Industriel et Commercial)", code: "CMCIFR2A", bic: "CMCIFR2A" },
      { name: "La Banque Postale", code: "PSSTFRPP", bic: "PSSTFRPP" },
      { name: "Boursorama Banque", code: "BOUSFRPP", bic: "BOUSFRPP" },
      { name: "Fortuneo Banque", code: "FTNOFRPP", bic: "FTNOFRPP" },
      { name: "Hello bank! France", code: "BNPAFRPP", bic: "BNPAFRPP" },
      { name: "LCL (Le Crédit Lyonnais)", code: "LCLYFRPP", bic: "LCLYFRPP" },
      { name: "HSBC Continental Europe", code: "CCFRFRPP", bic: "CCFRFRPP" },
      { name: "Shine (Société Générale)", code: "SHNEFRPP", bic: "SHNEFRPP" },
      { name: "Qonto", code: "QNTOFRPP", bic: "QNTOFRPP" },
      { name: "Nickel", code: "FPNEFRPP", bic: "FPNEFRPP" },
      { name: "Lydia Solutions", code: "LYDIFRPP", bic: "LYDIFRPP" },
      { name: "AXA Banque", code: "AXABFRPP", bic: "AXABFRPP" },
      { name: "Banque Palatine", code: "PALAFRPP", bic: "PALAFRPP" },
      { name: "Crédit du Nord", code: "NORDFRPP", bic: "NORDFRPP" },
    ],
  },
  CA: {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    scheme: "ca_transit",
    identifierLabel: "Account Number (7-12 digits)",
    secondaryLabel: "Transit (5-digit) & Inst. (3-digit)",
    banks: [
      { name: "Royal Bank of Canada (RBC)", code: "003" },
      { name: "TD Canada Trust", code: "004" },
      { name: "Scotiabank (Bank of Nova Scotia)", code: "002" },
      { name: "BMO (Bank of Montreal)", code: "001" },
      { name: "CIBC (Canadian Imperial Bank of Commerce)", code: "010" },
      { name: "National Bank of Canada", code: "006" },
      { name: "Desjardins Group", code: "815" },
      { name: "Tangerine Bank", code: "614" },
      { name: "Simplii Financial", code: "010" },
      { name: "HSBC Bank Canada", code: "016" },
      { name: "ATB Financial", code: "219" },
      { name: "Laurentian Bank of Canada", code: "039" },
      { name: "Canadian Western Bank", code: "509" },
      { name: "EQ Bank (Equitable Bank)", code: "623" },
      { name: "Vancity (Vancouver City Savings)", code: "809" },
      { name: "Meridian Credit Union", code: "837" },
      { name: "Coast Capital Savings", code: "809" },
      { name: "Manulife Bank of Canada", code: "540" },
      { name: "Motive Financial", code: "509" },
      { name: "Wealthsimple", code: "938" },
    ],
  },
  AU: {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    scheme: "au_bsb",
    identifierLabel: "Account Number (6-9 digits)",
    secondaryLabel: "BSB Number (6-digit)",
    banks: [
      { name: "Commonwealth Bank of Australia (CBA)", code: "062-000" },
      { name: "Westpac Banking Corporation", code: "032-000" },
      { name: "ANZ (Australia & New Zealand Bank)", code: "013-006" },
      { name: "NAB (National Australia Bank)", code: "082-001" },
      { name: "Macquarie Bank", code: "182-512" },
      { name: "Bendigo and Adelaide Bank", code: "633-000" },
      { name: "Bank of Queensland (BOQ)", code: "124-001" },
      { name: "Suncorp Bank", code: "484-799" },
      { name: "ING Bank Australia", code: "923-100" },
      { name: "HSBC Bank Australia", code: "342-011" },
      { name: "AMP Bank", code: "939-200" },
      { name: "Bankwest", code: "306-000" },
      { name: "St George Bank", code: "112-879" },
      { name: "Bank of Melbourne", code: "193-879" },
      { name: "BankSA", code: "105-000" },
      { name: "Great Southern Bank", code: "814-282" },
      { name: "Up Bank", code: "633-123" },
      { name: "ME Bank", code: "944-600" },
      { name: "Heritage Bank", code: "734-000" },
      { name: "People's Choice Credit Union", code: "805-050" },
      { name: "Police Bank", code: "802-884" },
      { name: "Teachers Mutual Bank", code: "812-170" },
      { name: "Qudos Bank", code: "212-200" },
      { name: "Judo Bank", code: "951-200" },
    ],
  },
  IN: {
    code: "IN",
    name: "India",
    currency: "INR",
    scheme: "in_ifsc",
    identifierLabel: "Account Number (9-18 digits)",
    secondaryLabel: "IFSC Code (11 characters)",
    banks: [
      { name: "State Bank of India (SBI)", code: "SBIN" },
      { name: "HDFC Bank", code: "HDFC" },
      { name: "ICICI Bank", code: "ICIC" },
      { name: "Axis Bank", code: "UTIB" },
      { name: "Kotak Mahindra Bank", code: "KKBK" },
      { name: "Punjab National Bank (PNB)", code: "PUNB" },
      { name: "Bank of Baroda", code: "BARB" },
      { name: "Canara Bank", code: "CNRB" },
      { name: "Union Bank of India", code: "UBIN" },
      { name: "IndusInd Bank", code: "INDB" },
      { name: "Bank of India", code: "BKID" },
      { name: "Central Bank of India", code: "CBIN" },
      { name: "Indian Overseas Bank", code: "IOBA" },
      { name: "IDBI Bank", code: "IBKL" },
      { name: "Indian Bank", code: "IDIB" },
      { name: "Yes Bank", code: "YESB" },
      { name: "Federal Bank", code: "FDRL" },
      { name: "AU Small Finance Bank", code: "AUBL" },
      { name: "RBL Bank", code: "RATN" },
      { name: "IDFC FIRST Bank", code: "IDFB" },
      { name: "UCO Bank", code: "UCBA" },
      { name: "Bank of Maharashtra", code: "MAHB" },
      { name: "Punjab & Sind Bank", code: "PSIB" },
      { name: "South Indian Bank", code: "SIBL" },
      { name: "Bandhan Bank", code: "BDBL" },
      { name: "City Union Bank", code: "CIUB" },
      { name: "Karur Vysya Bank", code: "KVBL" },
      { name: "Standard Chartered India", code: "SCBL" },
      { name: "HSBC India", code: "HSBC" },
      { name: "Paytm Payments Bank", code: "PYTM" },
      { name: "Airtel Payments Bank", code: "AIRP" },
    ],
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (23 alphanumeric characters)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "First Abu Dhabi Bank (FAB)", code: "NBADAEAD", bic: "NBADAEAD" },
      { name: "Emirates NBD", code: "EBILAEAD", bic: "EBILAEAD" },
      { name: "Abu Dhabi Commercial Bank (ADCB)", code: "ADCBAEAA", bic: "ADCBAEAA" },
      { name: "Dubai Islamic Bank (DIB)", code: "DIBEAEAD", bic: "DIBEAEAD" },
      { name: "Mashreq Bank", code: "BOMLAEAD", bic: "BOMLAEAD" },
      { name: "Abu Dhabi Islamic Bank (ADIB)", code: "ADIBEAAA", bic: "ADIBEAAA" },
      { name: "Commercial Bank of Dubai (CBD)", code: "CBDAAEAD", bic: "CBDAAEAD" },
      { name: "Emirates Islamic Bank", code: "EBILAEADISL", bic: "EBILAEADISL" },
      { name: "RAKBANK (National Bank of Ras Al Khaimah)", code: "RAKBAEAA", bic: "RAKBAEAA" },
      { name: "National Bank of Fujairah (NBF)", code: "NBFBAEAA", bic: "NBFBAEAA" },
      { name: "Sharjah Islamic Bank", code: "SHJBAEAA", bic: "SHJBAEAA" },
      { name: "Bank of Sharjah", code: "BOSHEAA", bic: "BOSHEAA" },
      { name: "Commercial Bank International (CBI)", code: "CBINAEAA", bic: "CBINAEAA" },
      { name: "United Arab Bank", code: "UABKAEAA", bic: "UABKAEAA" },
      { name: "Ajman Bank", code: "AJBMAEAA", bic: "AJBMAEAA" },
      { name: "HSBC Middle East (UAE)", code: "BBMEAEAD", bic: "BBMEAEAD" },
      { name: "Standard Chartered UAE", code: "SCBLAEAD", bic: "SCBLAEAD" },
      { name: "Citibank UAE", code: "CITIAEAD", bic: "CITIAEAD" },
      { name: "Wio Bank", code: "WIOBAEAA", bic: "WIOBAEAA" },
      { name: "Liv. Bank (Emirates NBD)", code: "EBILAEADLIV", bic: "EBILAEADLIV" },
    ],
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    scheme: "paystack",
    identifierLabel: "Account Number (10-digit NUBAN)",
    secondaryLabel: "Bank Selection",
    banks: [
      { name: "Access Bank", code: "044" },
      { name: "Access Bank (Diamond)", code: "063" },
      { name: "Citibank Nigeria", code: "023" },
      { name: "Ecobank Nigeria", code: "050" },
      { name: "Fidelity Bank", code: "070" },
      { name: "First Bank of Nigeria", code: "011" },
      { name: "First City Monument Bank (FCMB)", code: "214" },
      { name: "Globus Bank", code: "00103" },
      { name: "Guaranty Trust Bank (GTBank)", code: "058" },
      { name: "Heritage Bank", code: "030" },
      { name: "Jaiz Bank", code: "301" },
      { name: "Keystone Bank", code: "082" },
      { name: "Kuda Bank", code: "50211" },
      { name: "Lotus Bank", code: "303" },
      { name: "Moniepoint Microfinance Bank", code: "50515" },
      { name: "OPay", code: "999992" },
      { name: "Optimus Bank", code: "00107" },
      { name: "PalmPay", code: "999991" },
      { name: "Parallex Bank", code: "526" },
      { name: "Polaris Bank", code: "076" },
      { name: "PremiumTrust Bank", code: "000031" },
      { name: "Providus Bank", code: "101" },
      { name: "Rubies Bank", code: "125" },
      { name: "Signature Bank", code: "106" },
      { name: "Stanbic IBTC Bank", code: "221" },
      { name: "Standard Chartered Bank", code: "068" },
      { name: "Sterling Bank", code: "232" },
      { name: "SunTrust Bank", code: "100" },
      { name: "TAJ Bank", code: "302" },
      { name: "Titan Trust Bank", code: "102" },
      { name: "Union Bank of Nigeria", code: "032" },
      { name: "United Bank for Africa (UBA)", code: "033" },
      { name: "Unity Bank", code: "215" },
      { name: "VFD Microfinance Bank", code: "566" },
      { name: "Wema Bank (ALAT)", code: "035" },
      { name: "Zenith Bank", code: "057" },
    ],
  },
  GH: {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    scheme: "paystack",
    identifierLabel: "Account / Mobile Money Number",
    secondaryLabel: "Bank / Provider",
    banks: [
      { name: "GCB Bank Limited", code: "040100" },
      { name: "Ecobank Ghana", code: "130100" },
      { name: "Absa Bank Ghana", code: "030100" },
      { name: "Stanbic Bank Ghana", code: "090100" },
      { name: "Fidelity Bank Ghana", code: "240100" },
      { name: "Standard Chartered Bank Ghana", code: "020100" },
      { name: "Zenith Bank Ghana", code: "120100" },
      { name: "CalBank", code: "140100" },
      { name: "Access Bank Ghana", code: "280100" },
      { name: "Consolidated Bank Ghana (CBG)", code: "340100" },
      { name: "Republic Bank Ghana", code: "080100" },
      { name: "Prudential Bank", code: "180100" },
      { name: "Société Générale Ghana", code: "070100" },
      { name: "First National Bank Ghana", code: "330100" },
      { name: "Bank of Africa Ghana", code: "200100" },
      { name: "FBNBank Ghana", code: "170100" },
      { name: "Guaranty Trust Bank Ghana", code: "230100" },
      { name: "First Atlantic Bank", code: "190100" },
      { name: "OmniBSIC Bank", code: "350100" },
      { name: "Agricultural Development Bank (ADB)", code: "050100" },
      { name: "MTN Mobile Money", code: "MTN" },
      { name: "Vodafone Cash / Telecel Cash", code: "VOD" },
      { name: "AirtelTigo Money", code: "ATL" },
    ],
  },
  ZA: {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    scheme: "paystack",
    identifierLabel: "Account Number",
    secondaryLabel: "Bank Selection",
    banks: [
      { name: "Capitec Bank", code: "470010" },
      { name: "Standard Bank South Africa", code: "051001" },
      { name: "First National Bank (FNB)", code: "250655" },
      { name: "Absa Bank", code: "632005" },
      { name: "Nedbank", code: "198765" },
      { name: "African Bank", code: "430000" },
      { name: "Discovery Bank", code: "679000" },
      { name: "TymeBank", code: "678910" },
      { name: "Investec Bank", code: "580105" },
      { name: "Bidvest Bank", code: "462005" },
      { name: "Sasfin Bank", code: "683000" },
      { name: "Grindrod Bank", code: "223626" },
      { name: "Mercantile Bank", code: "450105" },
      { name: "Postbank (South Africa)", code: "460005" },
      { name: "Bank Zero", code: "888000" },
      { name: "UBank", code: "431010" },
      { name: "Al Baraka Bank", code: "800000" },
      { name: "HBZ Bank", code: "570126" },
      { name: "Habib Overseas Bank", code: "700001" },
      { name: "State Bank of India South Africa", code: "801000" },
    ],
  },
  KE: {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    scheme: "paystack",
    identifierLabel: "Account / M-Pesa Number",
    secondaryLabel: "Bank / Provider",
    banks: [
      { name: "M-Pesa (Safaricom)", code: "MPESA" },
      { name: "Airtel Money Kenya", code: "AIRTEL" },
      { name: "KCB Bank Kenya", code: "01" },
      { name: "Equity Bank Kenya", code: "68" },
      { name: "Co-operative Bank of Kenya", code: "11" },
      { name: "NCBA Bank Kenya", code: "07" },
      { name: "Absa Bank Kenya", code: "03" },
      { name: "Standard Chartered Kenya", code: "02" },
      { name: "Diamond Trust Bank (DTB)", code: "63" },
      { name: "Stanbic Bank Kenya", code: "31" },
      { name: "I&M Bank Kenya", code: "09" },
      { name: "Family Bank", code: "70" },
      { name: "Prime Bank Kenya", code: "10" },
      { name: "Bank of Africa Kenya", code: "19" },
      { name: "Gulf African Bank", code: "72" },
      { name: "Credit Bank", code: "66" },
      { name: "Sidian Bank", code: "60" },
      { name: "Kingdom Bank Kenya", code: "54" },
      { name: "Victoria Commercial Bank", code: "26" },
      { name: "Development Bank of Kenya", code: "49" },
      { name: "Guardian Bank", code: "35" },
      { name: "Habib Bank AG Zurich Kenya", code: "43" },
      { name: "Middle East Bank Kenya", code: "18" },
      { name: "SBM Bank Kenya", code: "25" },
      { name: "Premier Bank Kenya", code: "74" },
      { name: "UBA Kenya", code: "76" },
      { name: "Mayfair CIB Bank", code: "77" },
    ],
  },
  IE: {
    code: "IE",
    name: "Ireland",
    currency: "EUR",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (International Bank Account Number)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "AIB (Allied Irish Banks)", code: "AIBKIE2D", bic: "AIBKIE2D" },
      { name: "Bank of Ireland", code: "BOFIIE2D", bic: "BOFIIE2D" },
      { name: "PTSB (Permanent TSB)", code: "PTSBIE2D", bic: "PTSBIE2D" },
      { name: "Revolut Bank Ireland", code: "REVUIE21", bic: "REVUIE21" },
      { name: "Ulster Bank Ireland", code: "ULSBIE2D", bic: "ULSBIE2D" },
      { name: "An Post Money", code: "POSTIE2D", bic: "POSTIE2D" },
      { name: "EBS d.a.c.", code: "EBSIEI2D", bic: "EBSIEI2D" },
      { name: "Bunq Ireland", code: "BUNQIE22", bic: "BUNQIE22" },
    ],
  },
  ES: {
    code: "ES",
    name: "Spain",
    currency: "EUR",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (International Bank Account Number)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "Banco Santander", code: "BSCHESMM", bic: "BSCHESMM" },
      { name: "BBVA (Banco Bilbao Vizcaya Argentaria)", code: "BBVAESMM", bic: "BBVAESMM" },
      { name: "CaixaBank", code: "CAIXESBB", bic: "CAIXESBB" },
      { name: "Banco Sabadell", code: "BSABESBB", bic: "BSABESBB" },
      { name: "Bankinter", code: "BKBKESMM", bic: "BKBKESMM" },
      { name: "Abanca", code: "CAGMESMM", bic: "CAGMESMM" },
      { name: "Unicaja Banco", code: "UNICESMM", bic: "UNICESMM" },
      { name: "Kutxabank", code: "BAPVES22", bic: "BAPVES22" },
      { name: "Ibercaja Banco", code: "CAZRES2Z", bic: "CAZRES2Z" },
      { name: "ING Spain", code: "INGDESMM", bic: "INGDESMM" },
      { name: "Openbank", code: "OPENESMM", bic: "OPENESMM" },
      { name: "N26 Spain", code: "NTWOESMM", bic: "NTWOESMM" },
    ],
  },
  IT: {
    code: "IT",
    name: "Italy",
    currency: "EUR",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (International Bank Account Number)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "Intesa Sanpaolo", code: "BCITITMM", bic: "BCITITMM" },
      { name: "UniCredit", code: "UNCRITM1", bic: "UNCRITM1" },
      { name: "Banco BPM", code: "BAPPIT21", bic: "BAPPIT21" },
      { name: "BPER Banca", code: "BPMOIT22", bic: "BPMOIT22" },
      { name: "Banca Monte dei Paschi di Siena (MPS)", code: "PASCITM1", bic: "PASCITM1" },
      { name: "Poste Italiane (BancoPosta)", code: "BPPIITRR", bic: "BPPIITRR" },
      { name: "Mediobanca", code: "MEBIITMM", bic: "MEBIITMM" },
      { name: "Credito Emiliano (Credem)", code: "BACRIT22", bic: "BACRIT22" },
      { name: "FinecoBank", code: "FEBIITM1", bic: "FEBIITM1" },
      { name: "Banca Mediolanum", code: "MEDLITM1", bic: "MEDLITM1" },
      { name: "illimity Bank", code: "ILMTITMM", bic: "ILMTITMM" },
      { name: "N26 Italy", code: "NTWOITMM", bic: "NTWOITMM" },
    ],
  },
  NL: {
    code: "NL",
    name: "Netherlands",
    currency: "EUR",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (International Bank Account Number)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "ING Bank", code: "INGBNL2A", bic: "INGBNL2A" },
      { name: "Rabobank", code: "RABONL2U", bic: "RABONL2U" },
      { name: "ABN AMRO", code: "ABNANL2A", bic: "ABNANL2A" },
      { name: "de Volksbank (SNS / ASN Bank)", code: "SNSBNL2A", bic: "SNSBNL2A" },
      { name: "Triodos Bank Netherlands", code: "TRIBNL2U", bic: "TRIBNL2U" },
      { name: "bunq", code: "BUNQNL2A", bic: "BUNQNL2A" },
      { name: "Knab", code: "KNABNL2H", bic: "KNABNL2H" },
      { name: "Van Lanschot Kempen", code: "FVLBNL22", bic: "FVLBNL22" },
    ],
  },
  CH: {
    code: "CH",
    name: "Switzerland",
    currency: "CHF",
    scheme: "sepa_iban",
    identifierLabel: "IBAN (International Bank Account Number)",
    secondaryLabel: "BIC / SWIFT Code",
    banks: [
      { name: "UBS Switzerland", code: "UBSWCHZH", bic: "UBSWCHZH" },
      { name: "Credit Suisse (UBS)", code: "CRESCHZZ", bic: "CRESCHZZ" },
      { name: "PostFinance", code: "POFICHBE", bic: "POFICHBE" },
      { name: "Raiffeisen Switzerland", code: "RAIFCH22", bic: "RAIFCH22" },
      { name: "Zürcher Kantonalbank (ZKB)", code: "ZKBKCHZZ", bic: "ZKBKCHZZ" },
      { name: "Banque Cantonale de Genève (BCGE)", code: "BCGECHGG", bic: "BCGECHGG" },
      { name: "Banque Cantonale Vaudoise (BCV)", code: "BCVDCH2L", bic: "BCVDCH2L" },
      { name: "Julius Baer", code: "BAERCHZZ", bic: "BAERCHZZ" },
      { name: "Swissquote Bank", code: "SQBICH22", bic: "SQBICH22" },
      { name: "Neon Bank", code: "HYPLCH22", bic: "HYPLCH22" },
      { name: "Yuh", code: "YUHBCH22", bic: "YUHBCH22" },
    ],
  },
  GLOBAL: {
    code: "GLOBAL",
    name: "Other International (SWIFT / IBAN)",
    currency: "USD",
    scheme: "swift_iban",
    identifierLabel: "IBAN or Account Number",
    secondaryLabel: "SWIFT / BIC Code",
    banks: [
      { name: "Standard Chartered Bank", code: "SCBLGLOBAL" },
      { name: "Citibank International", code: "CITIGLOBAL" },
      { name: "HSBC Global Banking", code: "HSBCGLOBAL" },
      { name: "BNP Paribas International", code: "BNPAGLOBAL" },
      { name: "JPMorgan Chase International", code: "CHASGLOBAL" },
      { name: "Barclays International", code: "BARCGLOBAL" },
      { name: "Deutsche Bank International", code: "DEUTGLOBAL" },
      { name: "Banco Santander International", code: "SANTGLOBAL" },
      { name: "Société Générale International", code: "SOGEGLOBAL" },
      { name: "UBS International", code: "UBSWGLOBAL" },
      { name: "ING International", code: "INGBGLOBAL" },
      { name: "Bank of China", code: "BKCHGLOBAL" },
      { name: "ICBC (Industrial & Commercial Bank of China)", code: "ICBCGLOBAL" },
      { name: "SMBC (Sumitomo Mitsui Banking)", code: "SMBCGLOBAL" },
      { name: "MUFG Bank", code: "BOTKGLOBAL" },
      { name: "Mizuho Bank", code: "MHCBGLOBAL" },
      { name: "DBS Bank", code: "DBSSGLOBAL" },
      { name: "OCBC Bank", code: "OCBCGLOBAL" },
      { name: "United Overseas Bank (UOB)", code: "UOVBGLOBAL" },
      { name: "Wise (TransferWise)", code: "WISEGLOBAL" },
      { name: "Revolut Global", code: "REVUGLOBAL" },
    ],
  },
};

// Aliases mapping for 100% accurate, deterministic country matching
const COUNTRY_MAP: Record<string, string> = {
  // South Africa
  za: "ZA", zaf: "ZA", rsa: "ZA", southafrica: "ZA", "south africa": "ZA", southafrican: "ZA",
  // Nigeria
  ng: "NG", nga: "NG", nigeria: "NG", nigerian: "NG",
  // Ghana
  gh: "GH", gha: "GH", ghana: "GH", ghanaian: "GH",
  // Kenya
  ke: "KE", ken: "KE", kenya: "KE", kenyan: "KE",
  // United States
  us: "US", usa: "US", unitedstates: "US", "united states": "US", unitedstatesofamerica: "US", "united states of america": "US", america: "US", american: "US",
  // United Kingdom
  gb: "GB", gbr: "GB", uk: "GB", unitedkingdom: "GB", "united kingdom": "GB", greatbritain: "GB", "great britain": "GB", england: "GB", scotland: "GB", wales: "GB", british: "GB",
  // Germany
  de: "DE", deu: "DE", germany: "DE", deutschland: "DE", german: "DE",
  // France
  fr: "FR", fra: "FR", france: "FR", french: "FR",
  // Canada
  ca: "CA", can: "CA", canada: "CA", canadian: "CA",
  // Australia
  au: "AU", aus: "AU", australia: "AU", australian: "AU",
  // India
  in: "IN", ind: "IN", india: "IN", indian: "IN",
  // United Arab Emirates
  ae: "AE", are: "AE", uae: "AE", unitedarabemirates: "AE", "united arab emirates": "AE", dubai: "AE", abudhabi: "AE", "abu dhabi": "AE", emirates: "AE",
  // Ireland
  ie: "IE", irl: "IE", ireland: "IE", irish: "IE", eire: "IE",
  // Spain
  es: "ES", esp: "ES", spain: "ES", spanish: "ES", espana: "ES",
  // Italy
  it: "IT", ita: "IT", italy: "IT", italian: "IT", italia: "IT",
  // Netherlands
  nl: "NL", nld: "NL", netherlands: "NL", holland: "NL", dutch: "NL",
  // Switzerland
  ch: "CH", che: "CH", switzerland: "CH", swiss: "CH", schweiz: "CH", suisse: "CH",
  // Côte d'Ivoire
  ci: "CI", cotedivoire: "CI", "cote d'ivoire": "CI", ivorycoast: "CI", "ivory coast": "CI",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveCountryCode(input: string): string {
  if (!input) return "GLOBAL";
  const raw = String(input).trim().toLowerCase();
  if (COUNTRY_MAP[raw]) return COUNTRY_MAP[raw];
  const clean = raw.replace(/[^a-z0-9]/g, "");
  if (COUNTRY_MAP[clean]) return COUNTRY_MAP[clean];
  const upper = input.trim().toUpperCase();
  if (SUPPORTED_COUNTRIES[upper]) return upper;
  return "GLOBAL";
}

// Mod-97 IBAN Checksum Validator
function isValidIBAN(iban: string): boolean {
  const clean = iban.replace(/[\s-]/g, "").toUpperCase();
  if (clean.length < 15 || clean.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) return false;

  // Rearrange: move first 4 chars to end
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  
  // Convert letters to two-digit numbers (A=10, B=11, ..., Z=35)
  let numeric = "";
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numeric += (code - 55).toString();
    } else {
      numeric += rearranged[i];
    }
  }

  // Modulo 97 on large numbers using chunking
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = remainder.toString() + numeric.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
}

// US ABA Routing Number Checksum Validator
function isValidUSRouting(routing: string): boolean {
  const clean = routing.replace(/\D/g, "");
  if (clean.length !== 9) return false;
  const d = clean.split("").map(Number);
  const checksum = (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10;
  return checksum === 0;
}

// UK Sort Code Validator
function isValidSortCode(sortCode: string): boolean {
  const clean = sortCode.replace(/[\s-]/g, "");
  return /^\d{6}$/.test(clean);
}

// Fetch Paystack banks
async function fetchPaystackBanks(countryName: string, secret: string) {
  const banks: Array<{ name: string; code: string }> = [];
  const pageSize = 100;

  try {
    for (let page = 1; page <= 5; page += 1) {
      const url = new URL("https://api.paystack.co/bank");
      url.searchParams.set("country", countryName.toLowerCase());
      url.searchParams.set("perPage", String(pageSize));
      url.searchParams.set("page", String(page));

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!response.ok) break;

      const result = await response.json();
      const pageBanks = Array.isArray(result.data)
        ? result.data
            .filter((bank: { active?: boolean }) => bank.active !== false)
            .map((bank: { name?: string; code?: string }) => ({
              name: String(bank.name || ""),
              code: String(bank.code || ""),
            }))
            .filter((bank: { name: string; code: string }) => bank.name && bank.code)
        : [];

      banks.push(...pageBanks);
      const total = Number(result.meta?.total || 0);
      if (pageBanks.length < pageSize || (total > 0 && banks.length >= total)) break;
    }
  } catch (e) {
    console.error("Error fetching Paystack banks:", e);
  }

  return banks;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

  if (!authorization || !supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userResult, error: userError } = await userClient.auth.getUser();
  if (userError || !userResult.user) {
    return jsonResponse({ error: "A valid signed-in session is required." }, 401);
  }

  let body: {
    action?: string;
    country?: string;
    bankCode?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    sortCode?: string;
    iban?: string;
    swiftBic?: string;
    transitNumber?: string;
    institutionNumber?: string;
    bsb?: string;
    ifsc?: string;
    accountType?: string;
  };

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const action = body.action || "resolve";
  const user = userResult.user;

  // 1. ACTION: GET-COUNTRIES
  if (action === "get-countries") {
    const countries = Object.values(SUPPORTED_COUNTRIES).map((c) => ({
      code: c.code,
      name: c.name,
      currency: c.currency,
      scheme: c.scheme,
      identifierLabel: c.identifierLabel,
      secondaryLabel: c.secondaryLabel,
    }));
    return jsonResponse({ countries });
  }

  const countryCode = resolveCountryCode(body.country || user.user_metadata?.country || "");
  const countryConfig = SUPPORTED_COUNTRIES[countryCode] || SUPPORTED_COUNTRIES.GLOBAL;

  // 2. ACTION: GET-BANKS
  if (action === "banks") {
    // If country is Paystack scheme & secret is available
    if (countryConfig.scheme === "paystack" && paystackSecret) {
      const paystackBanks = await fetchPaystackBanks(countryConfig.name, paystackSecret);
      if (paystackBanks.length > 0) {
        return jsonResponse({
          country: countryConfig.code,
          scheme: countryConfig.scheme,
          banks: paystackBanks,
        });
      }
    }

    // Return static banks for scheme if defined
    const banks = countryConfig.banks || [];
    return jsonResponse({
      country: countryConfig.code,
      scheme: countryConfig.scheme,
      banks,
    });
  }

  // 3. ACTION: RESOLVE / VALIDATE
  if (action === "resolve") {
    const fullNameFromUser =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0].replace(/[._-]/g, " ").toUpperCase() : "Account Holder");

    // SCHEME: Paystack (Nigeria, Ghana, South Africa, Kenya)
    if (countryConfig.scheme === "paystack") {
      const bankCode = String(body.bankCode || "").trim();
      const accountNumber = String(body.accountNumber || "").replace(/\D/g, "");

      if (!bankCode) {
        return jsonResponse({ error: "Please select your bank." }, 400);
      }
      if (accountNumber.length !== 10) {
        return jsonResponse({ error: "Enter a valid 10-digit account number." }, 400);
      }

      if (paystackSecret) {
        try {
          const resolveUrl = new URL("https://api.paystack.co/bank/resolve");
          resolveUrl.searchParams.set("account_number", accountNumber);
          resolveUrl.searchParams.set("bank_code", bankCode);
          const resolveResponse = await fetch(resolveUrl, {
            headers: { Authorization: `Bearer ${paystackSecret}` },
          });

          if (resolveResponse.ok) {
            const resolveResult = await resolveResponse.json();
            const accountName = String(resolveResult.data?.account_name || "").trim();
            if (accountName) {
              return jsonResponse({
                isValid: true,
                accountName,
                institution: body.bankName || "Verified Bank",
                identifier: accountNumber,
                scheme: countryConfig.scheme,
              });
            }
          } else {
            const errResult = await resolveResponse.json().catch(() => ({}));
            return jsonResponse({
              error: errResult.message || "The bank could not verify that account number. Please check the account number and bank.",
            }, 422);
          }
        } catch (e) {
          console.warn("Paystack live resolve error:", e);
          return jsonResponse({
            error: "Unable to connect to the banking switch to resolve account holder name.",
          }, 502);
        }
      }

      // If no secret key is configured on the backend
      const requestedHolder = String(body.accountName || "").trim();
      return jsonResponse({
        isValid: true,
        accountName: requestedHolder || fullNameFromUser,
        institution: body.bankName || "Commercial Bank",
        identifier: accountNumber,
        scheme: countryConfig.scheme,
      });
    }

    // SCHEME: US ACH / Wire
    if (countryConfig.scheme === "us_ach") {
      const routing = String(body.routingNumber || body.bankCode || "").replace(/\D/g, "");
      const account = String(body.accountNumber || "").replace(/\D/g, "");

      if (routing.length !== 9) {
        return jsonResponse({ error: "ABA Routing Number must be exactly 9 digits." }, 400);
      }
      if (!isValidUSRouting(routing)) {
        return jsonResponse({ error: "Invalid US ABA routing number checksum." }, 422);
      }
      if (account.length < 4 || account.length > 17) {
        return jsonResponse({ error: "US Account Number must be between 4 and 17 digits." }, 400);
      }

      const matchedBank = countryConfig.banks?.find((b) => b.code === routing);
      const institutionName = matchedBank ? matchedBank.name : (body.bankName || "US Financial Institution");

      return jsonResponse({
        isValid: true,
        accountName: fullNameFromUser,
        institution: institutionName,
        routingNumber: routing,
        identifier: account,
        scheme: "us_ach",
        accountType: body.accountType || "Checking",
      });
    }

    // SCHEME: UK Sort Code + Account Number
    if (countryConfig.scheme === "gb_sort") {
      const sortCode = String(body.sortCode || body.bankCode || "").replace(/[\s-]/g, "");
      const account = String(body.accountNumber || "").replace(/\D/g, "");

      if (!isValidSortCode(sortCode)) {
        return jsonResponse({ error: "UK Sort code must be 6 digits (e.g. 20-00-00)." }, 400);
      }
      if (account.length !== 8) {
        return jsonResponse({ error: "UK Bank account number must be exactly 8 digits." }, 400);
      }

      const formattedSort = `${sortCode.slice(0, 2)}-${sortCode.slice(2, 4)}-${sortCode.slice(4, 6)}`;
      const matchedBank = countryConfig.banks?.find((b) => b.code === formattedSort || b.code.replace(/-/g, "") === sortCode);
      const institutionName = matchedBank ? matchedBank.name : (body.bankName || "UK Clearing Bank");

      return jsonResponse({
        isValid: true,
        accountName: fullNameFromUser,
        institution: institutionName,
        sortCode: formattedSort,
        identifier: account,
        scheme: "gb_sort",
      });
    }

    // SCHEME: SEPA / IBAN (Germany, France, Spain, UAE, etc.)
    if (countryConfig.scheme === "sepa_iban" || body.iban) {
      const iban = String(body.iban || body.accountNumber || "").replace(/[\s-]/g, "").toUpperCase();

      if (!isValidIBAN(iban)) {
        return jsonResponse({ error: "Invalid IBAN format or checksum failed (MOD-97)." }, 422);
      }

      const countryPrefix = iban.slice(0, 2);
      let swiftBic = String(body.swiftBic || "").trim().toUpperCase();
      let institutionName = body.bankName || `${countryConfig.name} Central Clearing`;

      if (countryConfig.banks) {
        const found = countryConfig.banks.find((b) => b.bic && iban.includes(b.code.slice(0, 4)));
        if (found) {
          institutionName = found.name;
          swiftBic = swiftBic || found.bic || "";
        }
      }

      // Format IBAN in 4-character blocks
      const formattedIBAN = iban.match(/.{1,4}/g)?.join(" ") || iban;

      return jsonResponse({
        isValid: true,
        accountName: fullNameFromUser,
        institution: institutionName,
        iban: formattedIBAN,
        swiftBic,
        identifier: formattedIBAN,
        scheme: "sepa_iban",
      });
    }

    // SCHEME: Canada Transit / Institution / Account
    if (countryConfig.scheme === "ca_transit") {
      const transit = String(body.transitNumber || "").replace(/\D/g, "");
      const institution = String(body.institutionNumber || body.bankCode || "").replace(/\D/g, "");
      const account = String(body.accountNumber || "").replace(/\D/g, "");

      if (transit.length !== 5) {
        return jsonResponse({ error: "Canadian Transit number must be 5 digits." }, 400);
      }
      if (institution.length !== 3) {
        return jsonResponse({ error: "Canadian Institution number must be 3 digits." }, 400);
      }
      if (account.length < 7 || account.length > 12) {
        return jsonResponse({ error: "Canadian Account number must be between 7 and 12 digits." }, 400);
      }

      const matchedBank = countryConfig.banks?.find((b) => b.code === institution);
      const institutionName = matchedBank ? matchedBank.name : (body.bankName || "Canadian Chartered Bank");

      return jsonResponse({
        isValid: true,
        accountName: fullNameFromUser,
        institution: institutionName,
        transitNumber: transit,
        institutionNumber: institution,
        identifier: account,
        scheme: "ca_transit",
      });
    }

    // SCHEME: Australia BSB + Account
    if (countryConfig.scheme === "au_bsb") {
      const bsb = String(body.bsb || body.bankCode || "").replace(/[\s-]/g, "");
      const account = String(body.accountNumber || "").replace(/\D/g, "");

      if (bsb.length !== 6) {
        return jsonResponse({ error: "Australian BSB must be 6 digits (e.g. 062-000)." }, 400);
      }
      if (account.length < 6 || account.length > 10) {
        return jsonResponse({ error: "Australian Account number must be between 6 and 10 digits." }, 400);
      }

      const formattedBsb = `${bsb.slice(0, 3)}-${bsb.slice(3, 6)}`;
      const matchedBank = countryConfig.banks?.find((b) => b.code === formattedBsb || b.code.replace(/-/g, "") === bsb);
      const institutionName = matchedBank ? matchedBank.name : (body.bankName || "Australian ADI Bank");

      return jsonResponse({
        isValid: true,
        accountName: fullNameFromUser,
        institution: institutionName,
        bsb: formattedBsb,
        identifier: account,
        scheme: "au_bsb",
      });
    }

    // SCHEME: India IFSC + Account
    if (countryConfig.scheme === "in_ifsc") {
      const ifsc = String(body.ifsc || body.bankCode || "").toUpperCase().replace(/[\s-]/g, "");
      const account = String(body.accountNumber || "").replace(/\D/g, "");

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        return jsonResponse({ error: "Invalid IFSC Code format (e.g. SBIN0001234)." }, 400);
      }
      if (account.length < 9 || account.length > 18) {
        return jsonResponse({ error: "Indian Bank Account number must be 9 to 18 digits." }, 400);
      }

      const bankPrefix = ifsc.slice(0, 4);
      const matchedBank = countryConfig.banks?.find((b) => b.code === bankPrefix);
      const institutionName = matchedBank ? matchedBank.name : (body.bankName || "Reserve Bank Network");

      return jsonResponse({
        isValid: true,
        accountName: fullNameFromUser,
        institution: institutionName,
        ifsc,
        identifier: account,
        scheme: "in_ifsc",
      });
    }

    // SCHEME: Global SWIFT / BIC + Account / IBAN
    const swift = String(body.swiftBic || "").trim().toUpperCase().replace(/[\s-]/g, "");
    const accountOrIban = String(body.iban || body.accountNumber || "").trim();
    const bankName = String(body.bankName || "").trim();

    if (!bankName) {
      return jsonResponse({ error: "Please enter your bank name." }, 400);
    }
    if (!swift || !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift)) {
      return jsonResponse({ error: "Enter a valid 8 or 11 character SWIFT/BIC code (e.g. CHASUS33)." }, 400);
    }
    if (!accountOrIban || accountOrIban.length < 5) {
      return jsonResponse({ error: "Please enter a valid IBAN or account number." }, 400);
    }

    return jsonResponse({
      isValid: true,
      accountName: fullNameFromUser,
      institution: bankName,
      swiftBic: swift,
      identifier: accountOrIban,
      scheme: "swift_iban",
    });
  }

  return jsonResponse({ error: "Unknown bank service action." }, 400);
});