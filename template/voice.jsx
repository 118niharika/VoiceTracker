import React, { useEffect, useState } from "react";

export default function Voice() {
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState({ suggestions: [], sipProposal: {} });
  const [status, setStatus] = useState("Click on mic to add expenses");
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    fetchExpenses();

    // Setup speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.lang = "en-IN";
      recog.interimResults = false;

      recog.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setStatus("You said: " + transcript);

        let amountMatch = transcript.match(/\d+/);
        let amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

        // detect category keywords
        let category = "Misc";
        if (transcript.toLowerCase().includes("food")) category = "Food";
        else if (transcript.toLowerCase().includes("travel")) category = "Travel";
        else if (transcript.toLowerCase().includes("rent")) category = "Rent";
        else if (transcript.toLowerCase().includes("shopping")) category = "Shopping";

        if (amount > 0) {
          await fetch("http://localhost:5000/add_expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: transcript, amount, category })
          });
          fetchExpenses();
        } else {
          alert("Couldn't detect amount, please try again.");
        }
      };

      recog.onerror = () => setStatus("Error in recognition, try again.");
      setRecognition(recog);
    }
  }, []);

  async function fetchExpenses() {
    let res = await fetch("http://localhost:5000/expenses");
    let data = await res.json();
    setExpenses(data.expenses || []);
    setInsights(data.insights || { suggestions: [], sipProposal: {} });
  }

  function startListening() {
    if (recognition) {
      recognition.start();
      setStatus("Listening...");
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6 mt-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">🎤 FinVoice - Expense Tracker</h1>

      <button
        onClick={startListening}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        🎤 Speak Expense
      </button>
      <p className="mt-2 text-gray-600">{status}</p>

      <h2 className="text-xl font-semibold mt-6">Recent Expenses</h2>
      <table className="w-full border-collapse mt-3">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Amount (₹)</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Description</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e, idx) => (
            <tr key={idx} className="text-center hover:bg-gray-100">
              <td className="border p-2">{new Date(e.ts).toLocaleString()}</td>
              <td className="border p-2">₹{e.amount}</td>
              <td className="border p-2">{e.category}</td>
              <td className="border p-2">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold">💡 Insights</h3>
        <ul className="list-disc ml-6">
          {insights.suggestions.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
        {insights.sipProposal?.monthly && (
          <p className="mt-2">
            If you invest ₹{insights.sipProposal.monthly}/month in SIP, in{" "}
            {insights.sipProposal.horizonMonths} months you may have ~₹
            {insights.sipProposal.projectedValue}
          </p>
        )}
      </div>
    </div>
  );
}
