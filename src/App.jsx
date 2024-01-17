import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [roundValue, setRoundValue] = useState("anonymous");
  const [datasetValue, setDatasetValue] = useState("toy");
  const [sentences, setSentences] = useState([]);
  const [inputValues, setInputValues] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [setupPhase, setSetupPhase] = useState(true);

  useEffect(() => {
    if (!setupPhase) {
      getSentences();
    }
  }, [setupPhase]);

  async function getSentences() {
    console.log("dataset_name:", `sentences_${datasetValue}`);
    const { data } = await supabase.from(`sentences_${datasetValue}`).select();
    setSentences(data);
    console.log("collected data:", data);

    if (data.length > 0) {
      setInputValues(new Array(data[0].masked.split("[MASK]").length).fill(""));
    }
  }

  async function insertResponses(sentenceId, values) {
    const { data, error } = await supabase.from(`responses_${datasetValue}`).upsert([
      {
        sentence_id: sentenceId,
        dataset: datasetValue,
        round: roundValue,
        response_values: values,
      },
    ]);

    if (error) {
      console.error("Error inserting responses:", error);
    } else {
      console.log("Responses inserted successfully:", data);
    }
  }

  const handleInputChange = (maskIndex, value) => {
    const newInputValues = [...inputValues];
    newInputValues[maskIndex] = value;

    // Trim the array to remove the empty string at the end
    setInputValues(newInputValues.filter((val) => val !== ""));
  };

  const handleSetupSubmit = () => {
    // Move to the text-filling task
    setSetupPhase(false);
  };

  const handleSubmit = async () => {
    // Handle the submission, e.g., update the state or send data to the server
    console.log("Submitted values:", inputValues);

    // Insert the current values into the Supabase "responses" table
    await insertResponses(sentences[currentSentenceIndex]?.id, inputValues);

    // Move to the next sentence
    setCurrentSentenceIndex((prevIndex) => (prevIndex + 1) % sentences.length);

    // count the number of collected
    setTotalCollected((prevCount) => prevCount + 1);

    // Clear input values for the next sentence
    setInputValues(new Array(sentences[currentSentenceIndex]?.masked.split("[MASK]").length).fill(""));
  };

  return (
    <div>
      {setupPhase ? (
        <React.Fragment>
          <p>Welcome to Masked Language Modeling for Humans!</p>
          <p>Your task is to fill in missing words in a sentence, so that the sentence makes sense to you.</p>
          <p>To begin, enter your Round ID and Dataset ID. (If you don't know what this means, leave them as is.)</p>
          <p>
            Round:
            <input
              type="text"
              value={roundValue}
              onChange={(event) => setRoundValue(event.target.value)}
            />
          </p>
          <p>
            Dataset:
            <input
              type="text"
              value={datasetValue}
              onChange={(event) => setDatasetValue(event.target.value)}
            />
          </p>
          <button onClick={handleSetupSubmit}>Start</button>
        </React.Fragment>
      ) : totalCollected < sentences.length ? (
        <React.Fragment>
          <p>Respond with the first word that comes to mind for each input. Responses should be one word each, and completed sentences should make sense gramatically.</p>
          <p>Don't worry about being factually correct, just give your best guesses!</p>
          <ul>
            {sentences[currentSentenceIndex]?.masked.split("[MASK]").map((part, maskIndex, array) => (
              <React.Fragment key={maskIndex}>
                {part}
                {maskIndex !== array.length - 1 && (
                  <input
                    type="text"
                    value={inputValues[maskIndex] || ''}
                    onChange={(event) => handleInputChange(maskIndex, event.target.value)}
                  />
                )}
              </React.Fragment>
            ))}
          </ul>
          <button onClick={handleSubmit}>Submit</button>
        </React.Fragment>
      ) : (
        <div>
          <p>Thanks so much for participating!</p>
        </div>
      )}
    </div>
  );
}

export default App;
