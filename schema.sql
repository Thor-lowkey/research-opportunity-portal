CREATE DATABASE IF NOT EXISTS research_portal;
USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    research_area VARCHAR(150),
    faculty_member VARCHAR(150),
    department VARCHAR(100),
    required_skills TEXT,
    available_positions INT NOT NULL DEFAULT 1,
    application_deadline DATE,
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open'
);