CREATE TABLE users
(
    id         SERIAL PRIMARY KEY,
    role       SMALLINT CHECK (role IN (10, 20)), -- 10=admin, 20=customer
    name       VARCHAR(255)        NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   TEXT                NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products
(
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255)   NOT NULL,
    description     TEXT,
    uuid            TEXT,
    price           DECIMAL(10, 2) NOT NULL,
    available_stock INT       default 0, --added
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    user_id         INT REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE product_identities
(
    id            SERIAL PRIMARY KEY,
    identity_no   VARCHAR(255) NOT NULL,
    identity_type SMALLINT CHECK (identity_type IN (10)), -- 10=serial
    product_id    INT REFERENCES products (id) ON DELETE CASCADE,
    uuid          TEXT         NOT NULL,                  --added
    is_available  BOOLEAN   DEFAULT TRUE,                 --added
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE (identity_type, identity_no)
);

CREATE TABLE product_files
(
    id         SERIAL PRIMARY KEY,
    filename   TEXT NOT NULL,
    file_type  SMALLINT CHECK (file_type IN (10, 11)), -- 10=certificate, 11=manual
    product_id INT REFERENCES products (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images
(
    id         SERIAL PRIMARY KEY,
    filename   TEXT NOT NULL,
    sort_order SMALLINT,
    product_id INT REFERENCES products (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_warranties
(
    id                        SERIAL PRIMARY KEY,
    product_identities_id     INT REFERENCES product_identities (id) ON DELETE CASCADE, --updated
    warranty_start_date       DATE NOT NULL,
    warranty_expiration_date  DATE NOT NULL,
    authenticity_confirmation BOOLEAN   DEFAULT TRUE,
    warranty_conditions       TEXT,
    void_conditions           TEXT,
    support_contact           TEXT,
    usage_advice              TEXT,
    created_at                TIMESTAMP DEFAULT NOW(),
    updated_at                TIMESTAMP DEFAULT NOW()
);

CREATE TABLE qr_code_scans
(
    id                    SERIAL PRIMARY KEY,
    product_id            INT REFERENCES products (id) ON DELETE CASCADE,
    product_identities_id INT REFERENCES product_identities (id) ON DELETE CASCADE, --added
    scan_type             VARCHAR(50) CHECK (scan_type IN ('model', 'unit')),
    scanned_at            TIMESTAMP DEFAULT NOW(),
    scanned_by            INT REFERENCES users (id) ON DELETE SET NULL,
    location              jsonb,                                                    --updated
    ip_address            VARCHAR(50)
);

CREATE TABLE customer_qr_codes
(
    id         SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users (id) ON DELETE CASCADE,
    qr_code    TEXT NOT NULL,
    title      VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stripe_product
(
    id                SERIAL PRIMARY KEY,
    product_id        INT REFERENCES products (id) ON DELETE CASCADE,
    stripe_product_id VARCHAR(255) NOT NULL,
    stripe_price_id   VARCHAR(255) NOT NULL
);

CREATE TABLE purchases
(
    id                    SERIAL PRIMARY KEY,
    user_id               INT            REFERENCES users (id) ON DELETE SET NULL,
    product_id            INT REFERENCES products (id) ON DELETE CASCADE,
    product_identities_id INT REFERENCES product_identities (id) ON DELETE CASCADE, --added
    purchase_date         TIMESTAMP DEFAULT NOW(),
    purchased_price       DECIMAL(10, 2) NOT NULL,
    payment_status        SMALLINT CHECK (payment_status IN (0, 1, 2)),             -- 0=pending, 1=paid, 2=failed
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_reset
(
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL,
    user_id    INT REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);