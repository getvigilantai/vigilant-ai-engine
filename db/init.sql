-- db/init.sql

-- Create the assets table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    location VARCHAR(255),
    purchase_date DATE,
    value NUMERIC(10, 2),
    status VARCHAR(50)
);

-- Insert some sample data into the assets table
INSERT INTO assets (name, type, location, purchase_date, value, status) VALUES
('Office Laptop 1', 'Laptop', 'Room 101', '2023-01-15', 1200.50, 'Active'),
('Office Printer', 'Printer', 'Common Area', '2022-11-20', 450.00, 'Active'),
('Conference Phone', 'Phone', 'Conference Room A', '2023-03-10', 150.75, 'In Repair'),
('Server Rack 1', 'Server', 'Data Center', '2021-05-01', 8500.00, 'Active');