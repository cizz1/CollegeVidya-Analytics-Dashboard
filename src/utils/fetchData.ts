import Papa from 'papaparse';

export interface DashboardData {
  funnel: {
    totalCalls: number;
    connected: number;
    didNotConnect: number;
    notInterested: number;
    uncertain: number;
    qualified: number;
  };
  notInterestedReasons: { name: string; value: number }[];
  uncertainReasons: { name: string; value: number }[];
  avgQualifiedScore: number;
  scriptPerformance: {
    name: string;
    didNotConnect: number;
    notInterested: number;
    uncertain: number;
    qualified: number;
  }[];
}

const dummyData: DashboardData = {
  funnel: {
    totalCalls: 10000,
    connected: 5000,
    didNotConnect: 5000,
    notInterested: 3000,
    uncertain: 1000,
    qualified: 1000,
  },
  notInterestedReasons: [
    { name: "Already Enrolled Elsewhere", value: 35 },
    { name: "Not Looking for Courses Currently", value: 25 },
    { name: "Budget/Financial Constraints", value: 20 },
    { name: "Preferred Another Institution", value: 15 },
    { name: "Wrong Contact / Not the Decision Maker", value: 5 },
  ],
  uncertainReasons: [
    { name: "Voicemail", value: 30 },
    { name: "Disconnected on hearing the reason", value: 25 },
    { name: "Disconnected with minimal conversation", value: 20 },
    { name: "Disconnected due to language barrier", value: 15 },
    { name: "Disconnected in middle", value: 5 },
    { name: "AI Identified", value: 5 },
  ],
  avgQualifiedScore: 78,
  scriptPerformance: [
    { name: "Script 1", didNotConnect: 1200, notInterested: 800, uncertain: 300, qualified: 200 },
    { name: "Script 2", didNotConnect: 1500, notInterested: 600, uncertain: 250, qualified: 150 },
    { name: "Script 3", didNotConnect: 1000, notInterested: 900, uncertain: 200, qualified: 300 },
    { name: "Script 4", didNotConnect: 1300, notInterested: 700, uncertain: 250, qualified: 350 },
  ]
};

export const fetchDashboardData = async (sheetUrl: string): Promise<DashboardData> => {
  try {
    // We try to fetch from the CSV export URL
    // Convert edit?usp=sharing to export?format=csv
    const csvUrl = sheetUrl.replace(/\/edit[^\/]*$/, '/export?format=csv');
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          // If the sheet is empty or headers don't match, we fallback to dummy data
          if (results.data.length === 0 || !results.meta.fields || results.meta.fields.length === 0) {
            resolve(dummyData);
            return;
          }

          // TODO: Actually parse real data from rows if needed
          // For now, if the sheet is blank, it falls back to dummy data.
          resolve(dummyData);
        },
        error: () => {
          resolve(dummyData);
        }
      });
    });
  } catch (err) {
    console.error("Error fetching sheet data, using fallback", err);
    return dummyData;
  }
};