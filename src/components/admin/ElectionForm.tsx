import { useState } from "react";
import type { TablesInsert } from "../../types/supabase";

interface ElectionFormProps {
    initialData?: Partial<TablesInsert<"elections">>;
    onSubmit: (data: TablesInsert<"elections">) => void;
    submitLabel?: string;
}

export default function ElectionForm({
    initialData = {},
    onSubmit,
    submitLabel = "作成",
}: ElectionFormProps) {
    const [formData, setFormData] = useState<TablesInsert<"elections">>({
        title: initialData.title || "",
        description: initialData.description || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputStyle = {
        width: "100%",
        padding: "0.6em",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1em",
        marginBottom: "1rem",
    };

    const labelStyle = {
        display: "block",
        marginBottom: "0.5rem",
        fontWeight: "500",
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
            <div>
                <label style={labelStyle}>選挙タイトル *</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    style={inputStyle}
                    placeholder="第n回マスコットキャラクター選挙"
                />
            </div>

            <div>
                <label style={labelStyle}>説明</label>
                <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                    }
                    style={{
                        ...inputStyle,
                        minHeight: "100px",
                        resize: "vertical",
                    }}
                    placeholder="選挙の詳細説明を入力してください"
                />
            </div>

            <div>
                <label style={labelStyle}>開始日時 *</label>
                <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                    style={inputStyle}
                />
            </div>

            <div>
                <label style={labelStyle}>終了日時 *</label>
                <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                    style={inputStyle}
                />
            </div>

            <button
                type="submit"
                style={{
                    backgroundColor: "#646cff",
                    color: "white",
                    border: "none",
                    padding: "0.8em 2em",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1em",
                    fontWeight: "500",
                }}
            >
                {submitLabel}
            </button>
        </form>
    );
}
