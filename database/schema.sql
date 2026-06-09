CREATE DATABASE IF NOT EXISTS glowvera_db;
USE glowvera_db;

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS stylist_services;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS stylists;
DROP TABLE IF EXISTS users;

-- Users table (Clients and Admins)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CLIENT', 'ADMIN') NOT NULL
) ENGINE=InnoDB;

-- Service Categories
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- Salon Services
CREATE TABLE services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Stylists (Staff) with working hours and breaks
CREATE TABLE stylists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    working_start TIME NOT NULL,
    working_end TIME NOT NULL,
    break_start TIME NOT NULL,
    break_end TIME NOT NULL
) ENGINE=InnoDB;

-- Stylist Services Junction Table (Skill Mappings)
CREATE TABLE stylist_services (
    stylist_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    PRIMARY KEY (stylist_id, service_id),
    FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Appointments Table
CREATE TABLE appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    stylist_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Optimized indexes for calendar timeline lookups
CREATE INDEX idx_appointments_start_stylist ON appointments(start_time, stylist_id);
CREATE INDEX idx_appointments_stylist_status ON appointments(stylist_id, status);
