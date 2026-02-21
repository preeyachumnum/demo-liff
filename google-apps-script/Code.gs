// ฟังก์ชันสำหรับรับ Webhook POST Request จากหน้าจอ LIFF
function doPost(e) {
  try {
    // กำหนด URL ของ Spreadsheet (สร้างไฟล์ Google Sheets ใหม่แล้วก็อปปี้ URL มาใส่)
    // สำหรับการรัน script แบบผูกกับ sheet สามารถใช้ SpreadsheetApp.getActiveSpreadsheet()
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // ทำการ parse data ที่ส่งมาจาก fetch API ฝั่ง React
    var data = JSON.parse(e.postData.contents);
    
    // เตรียมข้อมูลเป็นแถว (Array) ตามโครงสร้าง
    // A: วันเวลา, B: LINE User ID, C: LINE Display, D: ชื่อ, E: วันเกิด, F: เบอร์, G: ที่อยู่, H: หมายเหตุ, I: ยินยอม
    var rowData = [
      data.timestamp || new Date(), 
      data.userId || "",           
      data.displayName || "",      
      data.fullName || "",         
      data.birthDate || "",        
      data.phone || "",            
      data.address || "",          
      data.note || "",             
      data.consent ? "ยอมรับ" : "ไม่ยินยอม" 
    ];
    
    // เพิ่มข้อมูลลงแถวถัดไปของ Google Sheets
    sheet.appendRow(rowData);
    
    // ส่งค่ากลับไปว่าสำเร็จ เพื่อให้ React สั่ง liff.closeWindow()
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "Saved successfully"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // ถ้าเกิด Error ให้พ่น Error คืนกลับไปหา Liff
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
