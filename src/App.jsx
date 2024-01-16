import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [sentences, setSentences] = useState([]);
  const [inputValues, setInputValues] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);

  useEffect(() => {
    getSentences();
  }, []);

  async function getSentences() {
    const { data } = await supabase.from("sentences").select();
    setSentences(data);

    if (data.length > 0) {
      setInputValues(new Array(data[0].masked.split("[MASK]").length).fill(""));
    }
  }

  async function insertResponses(sentenceId, values) {
    const { data, error } = await supabase.from("responses").upsert([
      {
        sentence_id: sentenceId,
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
  

  const handleSubmit = async () => {
    // Handle the submission, e.g., update the state or send data to the server
    console.log("Submitted values:", inputValues);

    // Insert the current values into the Supabase "responses" table
    await insertResponses(sentences[currentSentenceIndex]?.id, inputValues);

    // Move to the next sentence
    setCurrentSentenceIndex((prevIndex) => (prevIndex + 1) % sentences.length);

    // count the number of collected
    setTotalCollected((prevCount) => (prevCount + 1));

    // Clear input values for the next sentence
    setInputValues(new Array(sentences[currentSentenceIndex]?.masked.split("[MASK]").length).fill(""));
  };

  // also should add a link to my website at the bottom of the page!
  // other questions: how much other info do I care to get? names? other demographics? idk
  // next steps: 
  // 1) need to create a good dataset of samples. Then, instead of just grabbing all of them, 
  //    we should grab a random sample of 20-50 of them.
  // 2) need to deploy this on the web somewhere, set it up so when I update it just fixes things
  // 3) need to write some code to automatically analyze these results (i.e. graph them, then set up the HF code)
  return (
    <div>
      {totalCollected < sentences.length ? (
        <React.Fragment>
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
