const themeToggle=document.querySelector(".theme-toggle");
const promptBtn=document.querySelector(".prompt-button");
const generateBtn=document.querySelector(".generate-btn");
const promptInput=document.querySelector(".prompt-input");
const promptForm=document.querySelector(".prompt-form");
const modelSelect=document.getElementById("model-select");
const countSelect=document.getElementById("count-select");
const ratioSelect=document.getElementById("ratio-select");
const galleryGrid=document.querySelector(".gallery-grid");
const API_KEY="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";   //Hugging face API Key

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

(()=>{
    const savedTheme=localStorage.getItem("theme");
    const systemPrefersDark=window.matchMedia("(prefers-color-scheme: dark)");
    const isDarkTheme= savedTheme==="dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme",isDarkTheme);
    themeToggle.querySelector("i").className= isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";

})();

// Switch between light and dark theme
themeToggle.addEventListener("click",()=>{
    const isDarkTheme=document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className= isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})

// Fill prompt input with random prompt
promptBtn.addEventListener("click",()=>{
    const prompt=examplePrompts[Math.floor(Math.random()*examplePrompts.length)]
    promptInput.value=prompt;
    promptInput.focus();
})

// Calculate width/height based on chosen ratio
const getImageDimensions=(aspectRatio,baseSize=512)=>{
    const [width,height]= aspectRatio.split("/").map(Number);
    const scaleFactor= baseSize / Math.sqrt(width * height);

    let calculateWidth= Math.round(width * scaleFactor);
    let calculateHeight= Math.round(height * scaleFactor);

    // Ensure dimensions are multiples of 16 (AI model requrirement)
    calculateWidth= Math.floor(calculateWidth/16)*16;
    calculateHeight=Math.floor(calculateHeight/16)*16;

    return {width:calculateWidth,height:calculateHeight};
}

// Replace loading spinner with actual image
const updateImageCard=(imgIndex,imgUrl)=>{
    const imgCard=document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML=`<img src="${imgUrl}" class="result-img">
                            <div class="img-overlay">
                                <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                            </div>`;
}

// Send requests to Hugging Face API to create images
const generateImages= async (selectedModel,imageCount,aspectRatio,promptText)=>{
    const MODEL_URL=`https://router.huggingface.co/hf-inference/models/${selectedModel}`;
    const {width,height} =getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled","true");

    // Create an array of image generation promises
    const imagePromises=Array.from({length: imageCount}, async(_,i)=>{
        // Send request to the AI Model API
        try {
          const response = await fetch(MODEL_URL, {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
              "x-use-catche": "false",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: promptText,
                parameters: { width, height },
            }),
          });

          if(!response.ok) throw new Error((await response.json())?.error);

          const result = await response.blob();
        //   Convert response into an image url and update the image card
          updateImageCard(i,URL.createObjectURL(result));    
        } catch (error) {
          console.log(error);
          const imgCard=document.getElementById(`img-card-${i}`);
          imgCard.classList.replace("loading","error");
          imgCard.querySelector(".status-text").innerText="Generation failed! Check console fo more details."
        }
    })

    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled");
}

// Creating placeholder cards with loading spinner
const createImageCards=(selectedModel,imageCount,aspectRatio,promptText)=>{
    galleryGrid.innerHTML="";
    for(let i=0;i<imageCount;i++)
    {
        galleryGrid.innerHTML+=`<div class="img-card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio}">
                            <div class="status-container">
                                <div class="spinner"></div>
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                <p class="status-text">Generating...</p>
                            </div>
                        </div>`
    }

    generateImages(selectedModel,imageCount,aspectRatio,promptText);
}

// Handle Form Submission
promptForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    
    // Get Form Values
    const selectedModel=modelSelect.value;
    const imageCount=parseInt(countSelect.value) || 1;
    const aspectRatio=ratioSelect.value || "1/1";
    const promptText=promptInput.value.trim();
    createImageCards(selectedModel,imageCount,aspectRatio,promptText);
})

