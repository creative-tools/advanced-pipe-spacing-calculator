/**
 * PDF Report Generator for Pipe Spacing
 */
const PDFGenerator = {
    generate(pipeConfigs, globalSettings) {
        // 1. Initialize jsPDF
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4

        // 2. Report Header
        doc.setFontSize(18);
        doc.text("Pipe Spacing Calculation Report", 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Calculation Logic: ${globalSettings.mode === 'pf' ? "Pipe-to-Flange" : "Pipe-to-Pipe"}`, 14, 30);
        doc.text(`Required Gap: ${globalSettings.gap} mm`, 14, 35);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

        // 3. Prepare Table Data 
        // Columns: a/a | Pipeline | Size | Class | Pipe OD | Flg OD | Ins | Flg Ins | BOP | C2C
        
        const tableBody = pipeConfigs.map((p, i) => {
            // Logic for C2C display: "Pipe X - Pipe Y \n Value"
            let c2cDisplay = "-";
            if (p.nextC2C !== null) {
                c2cDisplay = `Pipe ${i + 1} - Pipe ${i + 2}\n\n${p.nextC2C}`;
            }

            return [
                `Pipe ${i + 1}`,   // a/a
                p.name,            // Pipeline Name
                p.size + '"',      // Size
                p.cls,             // Class
                p.p_od,            // Pipe OD
                p.f_od,            // Flange OD
                p.p_ins,           // Insulation
                p.f_ins,           // Flange Insulation
                p.bop,             // BOP
                c2cDisplay         // Center to Center (Forward looking)
            ];
        });

        // 4. Generate Table
        doc.autoTable({
            startY: 48,
            head: [[
                'a/a', 
                'Pipeline', 
                'Size', 
                'Class', 
                'Pipe OD\n(mm)', 
                'Flange OD\n(mm)', 
                'Insulation\n(mm)', 
                'Flange\nInsulation\n(mm)', 
                'BOP\n(mm)', 
                'Center to Center\nDistance (mm)'
            ]],
            body: tableBody,
            theme: 'grid',
            headStyles: { 
                fillColor: [0, 86, 179], // Blue header
                halign: 'center',
                valign: 'middle',
                fontSize: 9
            },
            bodyStyles: {
                halign: 'center',
                valign: 'middle', // Centers text vertically
                textColor: [50, 50, 50]
            },
            columnStyles: {
                0: { fontStyle: 'bold', width: 20 }, // a/a column
                1: { halign: 'left', width: 35 },    // Name column
                9: { fontStyle: 'bold', textColor: [0, 86, 179], width: 40 } // C2C column
            },
            styles: { 
                fontSize: 9, 
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            }
        });

        // 5. Total Space Footer
        const finalY = doc.lastAutoTable.finalY + 15;
        
        // Draw a decorative line above total
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(14, finalY - 5, 100, finalY - 5); 
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text(globalSettings.totalText, 14, finalY);

        // 6. Save File
        doc.save(`Pipe_Arrangement_${new Date().getTime()}.pdf`);
    }
};