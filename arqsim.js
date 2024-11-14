function startSimulation() {
    const arqChoice = parseInt(document.getElementById("arqChoice").value);
    
    // Hide selection screen, show simulation screen
    document.getElementById("selectionScreen").style.display = "none";
    document.getElementById("simulationScreen").style.display = "block";

    // Store ARQ choice globally to use in the simulation
    window.arqChoice = arqChoice;
}

function runSimulation() {
    const totalFrames = parseInt(document.getElementById("totalFrames").value);
    const lostFrame = parseInt(document.getElementById("lostFrame").value);

    if (isNaN(totalFrames) || totalFrames <= 0 || lostFrame < -1 || lostFrame >= totalFrames) {
        alert("Please enter valid values for the total number of frames and the lost frame.");
        return;
    }

    const canvas = document.getElementById("arqCanvas");
    const ctx = canvas.getContext("2d");

    const frameSize = 50;
    const verticalSpacing = frameSize + 40;
    const canvasHeight = 100 + (totalFrames * verticalSpacing);
    canvas.height = canvasHeight > 1000 ? canvasHeight : 1000;

    ctx.font = "16px Arial";

    let subheading = '';
    switch (window.arqChoice) {
        case 1:
            subheading = "Stop-and-Wait ARQ";
            break;
        case 2:
            subheading = "Go-Back-N ARQ";
            break;
        case 3:
            subheading = "Selective Repeat ARQ";
            break;
    }
    
    ctx.fillText(subheading, 400, 30);

    ctx.fillText("Sender", 150, 60);
    ctx.fillText("Receiver", 850, 60);

    ctx.beginPath();
    ctx.moveTo(150, 70);
    ctx.lineTo(150, canvas.height - 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(850, 70);
    ctx.lineTo(850, canvas.height - 40);
    ctx.stroke();

    const drawFrame = (frame, y, sender, isLost) => {
        const x = sender ? 100 : 800;
        ctx.fillStyle = isLost ? "red" : "green";
        ctx.fillRect(x, y, frameSize, frameSize);
        ctx.strokeRect(x, y, frameSize, frameSize);
        ctx.fillStyle = "black";
        ctx.fillText(`Frame ${frame}`, x + (frameSize / 4), y + frameSize / 2);
    };

    const drawLine = (startX, startY, endX, endY, color) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    };

    let totalAcks = 0;
    let totalNacks = 0;
    let discardedFrames = 0;
    let lostFrames = 0;

    switch (window.arqChoice) {
        case 1:
            for (let i = 0; i < totalFrames; i++) {
                const y = 100 + (i * verticalSpacing);
                drawFrame(i, y, true, i === lostFrame);
                drawLine(150, y + frameSize / 2, 850, y + frameSize / 2, "black");

                if (i === lostFrame) {
                    ctx.fillText("Frame Lost", 450, y + frameSize / 2);
                    drawFrame(i, y, false, true);
                    discardedFrames++;
                    lostFrames++;
                    ctx.fillText(`Frame ${i} not acknowledged. Resending...`, 300, y + frameSize + 40);
                } else {
                    drawFrame(i, y, false, false);
                    drawLine(850, y + frameSize / 2, 150, y + frameSize + 40, "blue");
                    ctx.fillText(`ACK ${i}`, 400, y + frameSize + 40);
                    totalAcks++;
                }
            }
            break;
        case 2:
            const frameWindow = parseInt(prompt("Enter the frame window size: "));
            for (let i = 0; i < totalFrames;) {
                const windowEnd = Math.min(i + frameWindow, totalFrames);
                let transmissionSuccessful = true;
                let y = 100 + (i * verticalSpacing);

                for (let j = i; j < windowEnd; j++) {
                    drawFrame(j, y, true, j === lostFrame);
                    drawLine(150, y + frameSize / 2, 850, y + frameSize / 2, "black");

                    if (j === lostFrame) {
                        ctx.fillText("Frame Lost", 450, y + frameSize / 2);
                        transmissionSuccessful = false;
                        discardedFrames++;
                        lostFrames++;
                        break;
                    } else {
                        drawFrame(j, y, false, false);
                        drawLine(850, y + frameSize / 2, 150, y + frameSize + 40, "blue");
                        ctx.fillText(`ACK ${j}`, 400, y + frameSize + 40);
                        totalAcks++;
                        y += verticalSpacing;
                    }
                }
                if (!transmissionSuccessful) y += verticalSpacing;
                i += windowEnd - i;
            }
            break;
        case 3:
            const received = new Array(totalFrames).fill(false);

            for (let i = 0; i < totalFrames; i++) {
                const y = 100 + (i * verticalSpacing);
                drawFrame(i, y, true, i === lostFrame);
                drawLine(150, y + frameSize / 2, 850, y + frameSize / 2, "black");

                if (i === lostFrame) {
                    ctx.fillText("Frame Lost", 450, y + frameSize / 2);
                    discardedFrames++;
                    lostFrames++;
                } else {
                    drawFrame(i, y, false, false);
                    drawLine(850, y + frameSize / 2, 150, y + frameSize + 40, "blue");
                    ctx.fillText(`ACK ${i}`, 400, y + frameSize + 40);
                    received[i] = true;
                    totalAcks++;
                }
            }

            for (let i = 0; i < totalFrames; i++) {
                if (!received[i]) {
                    const y = 100 + (i * verticalSpacing) + 40;
                    drawFrame(i, y, true, true);
                    drawLine(150, y + frameSize / 2, 850, y + frameSize / 2, "red");
                    drawFrame(i, y + 40, false, false);
                    drawLine(850, y + 40 + frameSize / 2, 150, y + 80 + frameSize, "blue");
                    ctx.fillText(`NACK ${i}`, 400, y + frameSize / 2);
                    ctx.fillText(`Retransmit Frame ${i}`, 300, y + 40 + frameSize + 40);
                    ctx.fillText(`ACK ${i}`, 400, y + 80 + frameSize + 40);
                    totalNacks++;
                }
            }
            break;
    }

    const outputMetrics = document.getElementById("outputMetrics");
    outputMetrics.innerHTML = `
        <p>Total number of frames: ${totalFrames}</p>
        <p>Total number of ACKs: ${totalAcks}</p>
        <p>Total number of discarded frames: ${discardedFrames}</p>
        <p>Total number of lost frames: ${lostFrames}</p>
        ${window.arqChoice === 3 ? `<p>Total number of NACKs: ${totalNacks}</p>` : ""}
    `;
}
