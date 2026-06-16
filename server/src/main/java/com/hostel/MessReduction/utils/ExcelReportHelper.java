package com.hostel.MessReduction.utils;

import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

public class ExcelReportHelper {

    public static byte[] generateExcelReport(List<ReductionFormResDTO> reports) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Office Report");

            // Header Style
            CellStyle headerCellStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerCellStyle.setFont(headerFont);

            // Columns
            String[] columns = {
                "Student Name", "Register Number", "Gender", "Year", "Department",
                "Leave Date", "Arrival Date", "Total Holidays", "Assigned Deputy Warden", "Final Status"
            };

            // Header Row
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            // Data Rows
            int rowIdx = 1;
            for (ReductionFormResDTO report : reports) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(report.getName() != null ? report.getName() : "");
                row.createCell(1).setCellValue(report.getRegisterNo() != null ? report.getRegisterNo() : "");
                row.createCell(2).setCellValue(report.getGender() != null ? report.getGender().name() : "");
                row.createCell(3).setCellValue(report.getYear() != null ? report.getYear() + " Year" : "");
                row.createCell(4).setCellValue(report.getDepartment() != null ? report.getDepartment().name() : "");
                row.createCell(5).setCellValue(report.getLeaveDate() != null ? report.getLeaveDate().toString() : "");
                row.createCell(6).setCellValue(report.getArrivalDate() != null ? report.getArrivalDate().toString() : "");
                row.createCell(7).setCellValue(report.getTotalHolidays() != null ? report.getTotalHolidays() : 0L);
                row.createCell(8).setCellValue(report.getAssignedDeputyWarden() != null ? report.getAssignedDeputyWarden() : "");
                row.createCell(9).setCellValue(report.getCurrentStatus() != null ? report.getCurrentStatus().name() : "");
            }

            // Auto-fit columns
            for (int col = 0; col < columns.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
