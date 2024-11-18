let sent = 0;
let lost = 0;
let discarded = 0;
let ack = 0;
let transmissions = 0;
let nack = 0;

// Helper functions for delays and lost frames
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start the simulation based on the selected protocol
function startSimulation() {
    const protocolChoice = document.getElementById("arqChoice").value;
    localStorage.setItem("protocol", protocolChoice);
    window.location.href = "simulation.html";
}

// Navigate back to the selection screen
function goBack() {
    window.location.href = "index.html";
}

// Main function to run the ARQ simulation
async function runSimulation() {
    const totalFrames = parseInt(document.getElementById("totalFrames").value);
    const lostFramesInput = document.getElementById("lostFrames").value.trim();
    // const lostFrames = parseInt(document.getElementById("lostFrames").value);
    const frameWindowSize = parseInt(
        document.getElementById("frameSize").value
    ); // Window size input
    const lostFrames = lostFramesInput
        ? lostFramesInput.split(",").map(Number)
        : [];
    const protocol = parseInt(localStorage.getItem("protocol"));

    // Clear canvas and output
    const canvas = document.getElementById("arqCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("outputMetrics").innerHTML = "";

    // Draw vertical lines for sender and receiver
    ctx.beginPath();
    ctx.moveTo(150, 70);
    ctx.lineTo(150, canvas.height - 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(850, 70);
    ctx.lineTo(850, canvas.height - 40);
    ctx.stroke();

    // Initialize statistics

    // Run simulation for the chosen protocol
    if (protocol === 1) {
        await stopAndWait(totalFrames, lostFrames, ctx);
    } else if (protocol === 2) {
        await goBackN(totalFrames, lostFrames, frameWindowSize, ctx);
    } else if (protocol === 3) {
        await selectiveRepeat(totalFrames, lostFrames, ctx);
    } else {
        alert("Invalid protocol selection!");
    }

    // Display statistics
    displayStats();

    sent = 0;
    lost = 0;
    discarded = 0;
    ack = 0;
    transmissions = 0;
    nack = 0;

    // function updateStats(sent, discarded, ack, transmissions, nack) {
    //     totalSent += sent;
    //     totalDiscarded += discarded;
    //     totalAckSent += ack;
    //     totalTransmissions += transmissions;
    //     totalNack += nack;
    // }
}

// Stop-and-Wait ARQ
async function stopAndWait(totalFrames, lostFrames, ctx) {
    ctx.font = "16px Arial";
    ctx.fillText("Stop-and-Wait ARQ", 500, 30);

    for (let i = 0; i < totalFrames; i++) {
        const y = 100 + i * 80;

        // Draw the frame
        ctx.fillStyle = "black";
        ctx.fillText(`Frame ${i}`, 160, y + 30);
        ctx.beginPath();
        ctx.moveTo(200, y + 20);
        ctx.lineTo(850, y + 20);
        ctx.strokeStyle = lostFrames.includes(i) ? "red" : "green";
        ctx.stroke();

        // Simulate lost frame
        if (lostFrames.includes(i)) {
            ctx.fillStyle = "red";
            ctx.fillText("Frame Lost", 400, y + 30);
            lost++;
            await delay(1000);

            // Resend the lost frame
            ctx.fillStyle = "black";
            ctx.fillText(`Resending Frame ${i}`, 160, y + 60);
            transmissions++;
            ctx.beginPath();
            ctx.moveTo(200, y + 50);
            ctx.lineTo(850, y + 50);
            ctx.strokeStyle = "green";
            ctx.stroke();
            // await delay(1000);
        }

        // Acknowledge the frame
        if (!lostFrames.includes(i)) {
            ctx.fillStyle = "green";
            ctx.fillText(`ACK ${i}`, 600, y + 30);
        }
        ack++;
        transmissions++;
        await delay(1000);
    }
    sent = totalFrames;

    ctx.fillStyle = "black";
    ctx.fillText("Simulation Complete!", 500, 100 + totalFrames * 80);
}

// Go-Back-N ARQ
async function goBackN(totalFrames, lostFrames, windowSize, ctx) {
    ctx.font = "16px Arial";
    ctx.fillText("Go-Back-N ARQ", 500, 30);
    let frameNumber = 0;
    let y = 100;

    while (frameNumber < totalFrames) {
        const endFrame = Math.min(frameNumber + windowSize, totalFrames);
        ctx.fillText(
            `Sending Frames ${frameNumber} to ${endFrame - 1}`,
            160,
            y
        );
        y += 20;

        let resend = false;

        for (let i = frameNumber; i < endFrame; i++) {
            ctx.fillText(`Frame ${i}`, 160, y + 30);
            ctx.beginPath();
            ctx.moveTo(200, y + 20);
            ctx.lineTo(850, y + 20);
            ctx.strokeStyle = lostFrames.includes(i) ? "red" : "green";
            ctx.stroke();

            if (lostFrames.includes(i)) {
                ctx.fillStyle = "red";
                ctx.fillText("Frame Lost", 400, y + 30);
                resend = true;
                break;
            } else {
                ctx.fillStyle = "green";
                ctx.fillText(`ACK ${i}`, 600, y + 30);
                y += 60;
            }
        }

        if (resend) {
            ctx.fillText(
                `Resending Frames ${frameNumber} to ${endFrame - 1}`,
                160,
                y
            );
            await delay(1000);
        } else {
            frameNumber += windowSize;
        }

        await delay(1000);
    }

    ctx.fillText("Simulation Complete!", 500, y + 40);
}

// Selective Repeat ARQ
async function selectiveRepeat(totalFrames, lostFrames, ctx) {
    ctx.font = "16px Arial";
    ctx.fillText("Selective Repeat ARQ", 500, 30);

    for (let i = 0; i < totalFrames; i++) {
        const y = 100 + i * 80;
        let frameSent = false;

        // Ensure all frames (0 to totalFrames-1) are shown
        ctx.fillText(`Frame ${i}`, 160, y + 30);
        ctx.beginPath();
        ctx.moveTo(200, y + 20);
        ctx.lineTo(850, y + 20);
        ctx.strokeStyle = lostFrames.includes(i) ? "red" : "green";
        ctx.stroke();

        if (lostFrames.includes(i)) {
            ctx.fillStyle = "red";
            ctx.fillText("Frame Lost", 400, y + 30);
            await delay(1000);

            // Resend frame
            ctx.fillStyle = "black";
            ctx.fillText(`NACK for Frame ${i}`, 160, y + 60);
            ctx.fillText(`Resending Frame ${i}`, 160, y + 90);
            ctx.beginPath();
            ctx.moveTo(200, y + 80);
            ctx.lineTo(850, y + 80);
            ctx.strokeStyle = "green";
            ctx.stroke();
            ctx.fillText(`Frame ${i}`, 160, y + 110);
            if (i !== totalFrames - 1) {
                ctx.fillText(`ACK ${i}`, 600, y + 110);
            }
            await delay(1000);
        } else {
            ctx.fillStyle = "green";
            frameSent = true;
            ctx.fillText(`ACK ${i}`, 600, y + 30);
            await delay(1000);
        }
    }

    ctx.fillText("Simulation Complete!", 500, 100 + totalFrames * 80);
}

// Function to save canvas as an image
function saveAsImage() {
    const canvas = document.getElementById("arqCanvas");
    const link = document.createElement("a");
    link.download = "arq_simulation.png";
    link.href = canvas.toDataURL();
    link.click();
}

// Function to display statistics
function displayStats() {
    const stats = `
      Total Frames Sent: ${sent}<br>
      Total Lost Frames: ${lost}<br>
      Total Discarded Frames: ${discarded}<br>
      Total ACK Sent: ${ack}<br>
      Total Transmissions (including retransmissions): ${transmissions}<br>
      Total NACKs (Selective Repeat only): ${nack}
  `;
    document.getElementById("outputMetrics").innerHTML = stats;
}
