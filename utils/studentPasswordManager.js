// Student Password Generation and Management System
const crypto = require('crypto');

class StudentPasswordManager {
    /**
     * Generate a unique password based on student number
     * Format: First 2 letters of student number + year + last 3 digits + checksum
     * Example: STU24001 -> ST24001X (where X is checksum)
     */
    static generatePassword(studentNumber) {
        if (!studentNumber || studentNumber.length < 6) {
            throw new Error('Invalid student number format');
        }
        
        // Extract components
        const prefix = studentNumber.substring(0, 2).toUpperCase();
        const year = new Date().getFullYear().toString().slice(-2);
        const lastDigits = studentNumber.slice(-3);
        
        // Generate checksum
        const hash = crypto.createHash('md5').update(studentNumber).digest('hex');
        const checksum = hash.charAt(0).toUpperCase();
        
        return `${prefix}${year}${lastDigits}${checksum}`;
    }

    /**
     * Validate student number format
     * Expected format: STU + Year + Grade + Section + Number (e.g., STU24009A001)
     */
    static validateStudentNumber(studentNumber) {
        const pattern = /^[A-Z]{3}\d{2}\d{1,2}[A-Z]\d{3}$/;
        return pattern.test(studentNumber);
    }

    /**
     * Extract grade and section from student number
     */
    static parseStudentNumber(studentNumber) {
        if (!this.validateStudentNumber(studentNumber)) {
            throw new Error('Invalid student number format');
        }
        
        // STU24009A001 -> Grade: 9, Section: A
        const match = studentNumber.match(/^[A-Z]{3}\d{2}(\d{1,2})([A-Z])\d{3}$/);
        if (match) {
            return {
                grade: match[1],
                section: match[2],
                year: '20' + studentNumber.substring(3, 5)
            };
        }
        
        throw new Error('Could not parse student number');
    }

    /**
     * Generate batch of student numbers for a grade/section
     */
    static generateStudentNumbers(grade, section, count, schoolPrefix = 'STU') {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const gradeFormatted = grade.toString().padStart(2, '0');
        
        const numbers = [];
        for (let i = 1; i <= count; i++) {
            const sequence = i.toString().padStart(3, '0');
            const studentNumber = `${schoolPrefix}${currentYear}${gradeFormatted}${section}${sequence}`;
            numbers.push(studentNumber);
        }
        
        return numbers;
    }

    /**
     * Generate secure temporary password for initial setup
     */
    static generateTempPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

module.exports = StudentPasswordManager;
