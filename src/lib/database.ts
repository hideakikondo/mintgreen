export interface DatabaseClient {
    from(table: string): any;
    auth: {
        getSession(): Promise<{ data: { session: any }; error: any }>;
        onAuthStateChange(callback: (event: any, session: any) => void): {
            data: { subscription: { unsubscribe(): void } };
        };
        signInWithOAuth(options: any): Promise<void>;
        signOut(): Promise<void>;
    };
}

export class SQLiteClient implements DatabaseClient {
    private initialized = false;

    async initialize() {
        if (this.initialized) return;

        try {
            console.log("Using in-memory mock database for local development");
            this.initialized = true;
        } catch (error) {
            console.error("Failed to initialize SQLite:", error);
            this.initialized = false;
            throw error;
        }
    }

    from(table: string) {
        return new SQLiteQueryBuilder(null, table);
    }

    auth = {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (_callback: any) => ({
            data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithOAuth: async () => {},
        signOut: async () => {},
    };
}

class SQLiteQueryBuilder {
    constructor(
        private db: any,
        private table: string,
    ) {}

    select(columns = "*") {
        return new SQLiteSelectBuilder(this.db, this.table, columns);
    }

    insert(data: any) {
        return new SQLiteInsertBuilder(this.db, this.table, data);
    }

    update(data: any) {
        return new SQLiteUpdateBuilder(this.db, this.table, data);
    }

    delete() {
        return new SQLiteDeleteBuilder(this.db, this.table);
    }
}

class SQLiteSelectBuilder {
    private conditions: string[] = [];
    private orderBy: string = "";
    private limitOne = false;

    constructor(
        private db: any,
        private table: string,
        private columns: string,
    ) {}

    eq(column: string, value: any) {
        this.conditions.push(`${column} = ${this.formatValue(value)}`);
        return this;
    }

    lt(column: string, value: any) {
        this.conditions.push(`${column} < ${this.formatValue(value)}`);
        return {
            order: (orderColumn: string, options?: { ascending: boolean }) => {
                const direction = options?.ascending === false ? "DESC" : "ASC";
                this.orderBy = `ORDER BY ${orderColumn} ${direction}`;
                return this.execute();
            },
        };
    }

    lte(column: string, value: any) {
        this.conditions.push(`${column} <= ${this.formatValue(value)}`);
        return {
            gte: (gteColumn: string, gteValue: any) => {
                this.conditions.push(
                    `${gteColumn} >= ${this.formatValue(gteValue)}`,
                );
                return this.execute();
            },
        };
    }

    gte(column: string, value: any) {
        this.conditions.push(`${column} >= ${this.formatValue(value)}`);
        return this.execute();
    }

    order(column: string, options?: { ascending: boolean }) {
        const direction = options?.ascending === false ? "DESC" : "ASC";
        this.orderBy = `ORDER BY ${column} ${direction}`;
        return this.execute();
    }

    single() {
        this.limitOne = true;
        return this.execute();
    }

    private formatValue(value: any): string {
        if (typeof value === "string") {
            return `'${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === "boolean") {
            return value ? "1" : "0";
        }
        if (value === null || value === undefined) {
            return "NULL";
        }
        return String(value);
    }

    private execute() {
        return {
            then: (resolve: any, reject?: any) => {
                try {
                    let sql = `SELECT ${this.columns} FROM ${this.table}`;

                    if (this.conditions.length > 0) {
                        sql += ` WHERE ${this.conditions.join(" AND ")}`;
                    }

                    if (this.orderBy) {
                        sql += ` ${this.orderBy}`;
                    }

                    if (this.limitOne) {
                        sql += ` LIMIT 1`;
                    }

                    const stmt = this.db.prepare(sql);
                    const results = [];

                    while (stmt.step()) {
                        const row = stmt.getAsObject();
                        results.push(this.convertRow(row));
                    }

                    stmt.free();

                    const data = this.limitOne ? results[0] || null : results;
                    resolve({ data, error: null });
                } catch (error) {
                    console.error("SQLite select error:", error);
                    if (reject) reject({ data: null, error });
                    else resolve({ data: null, error });
                }
            },
        };
    }

    private convertRow(row: any): any {
        const converted = { ...row };
        for (const key in converted) {
            if (key.includes("is_") && typeof converted[key] === "number") {
                converted[key] = Boolean(converted[key]);
            }
        }
        return converted;
    }

    then(resolve: any, reject?: any) {
        return this.execute().then(resolve, reject);
    }
}

class SQLiteInsertBuilder {
    constructor(
        private db: any,
        private table: string,
        private data: any,
    ) {}

    select() {
        return {
            single: () => this.executeWithReturn(true),
            then: (resolve: any, reject?: any) =>
                this.executeWithReturn(false).then(resolve, reject),
        };
    }

    private executeWithReturn(single: boolean) {
        return {
            then: (resolve: any, reject?: any) => {
                try {
                    const isArray = Array.isArray(this.data);
                    const records = isArray ? this.data : [this.data];
                    const insertedRecords = [];

                    for (const record of records) {
                        const columns = Object.keys(record).filter(
                            (key) => record[key] !== undefined,
                        );
                        const values = columns.map((col) =>
                            this.formatValue(record[col]),
                        );

                        let sql = `INSERT INTO ${this.table} (${columns.join(", ")}) VALUES (${values.join(", ")})`;

                        this.db.run(sql);

                        const lastRowId = this.db.exec(
                            "SELECT last_insert_rowid()",
                        )[0]?.values[0]?.[0];

                        let selectSql = `SELECT * FROM ${this.table} WHERE rowid = ${lastRowId}`;
                        const result = this.db.exec(selectSql);

                        if (result.length > 0 && result[0].values.length > 0) {
                            const row: any = {};
                            result[0].columns.forEach(
                                (col: string, index: number) => {
                                    row[col] = result[0].values[0][index];
                                },
                            );
                            insertedRecords.push(this.convertRow(row));
                        }
                    }

                    const data = single
                        ? insertedRecords[0] || null
                        : insertedRecords;
                    resolve({ data, error: null });
                } catch (error) {
                    console.error("SQLite insert error:", error);
                    if (reject) reject({ data: null, error });
                    else resolve({ data: null, error });
                }
            },
        };
    }

    private formatValue(value: any): string {
        if (typeof value === "string") {
            return `'${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === "boolean") {
            return value ? "1" : "0";
        }
        if (value === null || value === undefined) {
            return "NULL";
        }
        return String(value);
    }

    private convertRow(row: any): any {
        const converted = { ...row };
        for (const key in converted) {
            if (key.includes("is_") && typeof converted[key] === "number") {
                converted[key] = Boolean(converted[key]);
            }
        }
        return converted;
    }

    then(resolve: any, reject?: any) {
        return {
            then: (innerResolve: any, innerReject?: any) => {
                try {
                    const isArray = Array.isArray(this.data);
                    const records = isArray ? this.data : [this.data];

                    for (const record of records) {
                        const columns = Object.keys(record).filter(
                            (key) => record[key] !== undefined,
                        );
                        const values = columns.map((col) =>
                            this.formatValue(record[col]),
                        );

                        let sql = `INSERT INTO ${this.table} (${columns.join(", ")}) VALUES (${values.join(", ")})`;
                        this.db.run(sql);
                    }

                    innerResolve({ data: null, error: null });
                } catch (error) {
                    console.error("SQLite insert error:", error);
                    if (innerReject) innerReject({ data: null, error });
                    else innerResolve({ data: null, error });
                }
            },
        }.then(resolve, reject);
    }
}

class SQLiteUpdateBuilder {
    private conditions: string[] = [];

    constructor(
        private db: any,
        private table: string,
        private data: any,
    ) {}

    eq(column: string, value: any) {
        this.conditions.push(`${column} = ${this.formatValue(value)}`);
        return {
            then: (resolve: any, reject?: any) => {
                try {
                    const setClauses = Object.keys(this.data)
                        .filter((key) => this.data[key] !== undefined)
                        .map(
                            (key) =>
                                `${key} = ${this.formatValue(this.data[key])}`,
                        );

                    let sql = `UPDATE ${this.table} SET ${setClauses.join(", ")}`;

                    if (this.conditions.length > 0) {
                        sql += ` WHERE ${this.conditions.join(" AND ")}`;
                    }

                    this.db.run(sql);
                    resolve({ data: [], error: null });
                } catch (error) {
                    console.error("SQLite update error:", error);
                    if (reject) reject({ data: null, error });
                    else resolve({ data: null, error });
                }
            },
        };
    }

    private formatValue(value: any): string {
        if (typeof value === "string") {
            return `'${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === "boolean") {
            return value ? "1" : "0";
        }
        if (value === null || value === undefined) {
            return "NULL";
        }
        return String(value);
    }
}

class SQLiteDeleteBuilder {
    private conditions: string[] = [];

    constructor(
        private db: any,
        private table: string,
    ) {}

    eq(column: string, value: any) {
        this.conditions.push(`${column} = ${this.formatValue(value)}`);
        return {
            then: (resolve: any, reject?: any) => {
                try {
                    let sql = `DELETE FROM ${this.table}`;

                    if (this.conditions.length > 0) {
                        sql += ` WHERE ${this.conditions.join(" AND ")}`;
                    }

                    this.db.run(sql);
                    resolve({ data: null, error: null });
                } catch (error) {
                    console.error("SQLite delete error:", error);
                    if (reject) reject({ data: null, error });
                    else resolve({ data: null, error });
                }
            },
        };
    }

    private formatValue(value: any): string {
        if (typeof value === "string") {
            return `'${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === "boolean") {
            return value ? "1" : "0";
        }
        if (value === null || value === undefined) {
            return "NULL";
        }
        return String(value);
    }
}
