import sys

with open("client/src/StaffLogin.jsx", "r") as f:
    content = f.read()

# 1. Update onChange for Role select to reset userName
content = content.replace("""onChange={(e) => setRole(e.target.value)}""", """onChange={(e) => { setRole(e.target.value); setUserName(""); }}""")

# 2. Add getUsernameOptions helper function inside StaffLogin component
target_str = """  const [error, setError] = useState("")"""
replacement_str = """  const [error, setError] = useState("")

  const getUsernameOptions = () => {
    if (role === "Office") return ["office"];
    if (role === "Warden") return ["warden", "warden1", "warden2", "warden3", "warden4"];
    if (role === "DeputyWarden") return Array.from({ length: 8 }, (_, i) => `deputyWarden${i + 1}`);
    return [];
  };"""
content = content.replace(target_str, replacement_str)

# 3. Replace the Username Field with a custom select block
field_str = """<Field icon={<FiUser size={18} />} error={!!error} type="text" placeholder="Username" value={userName} onChange={(e) => setUserName(e.target.value)} required />"""

username_select = """<div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all bg-[#0a1628] w-full ${error && !userName ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'}`}>
                                    <span className={error && !userName ? "text-rose-400" : "text-amber-400/60"}><FiUser size={18} /></span>
                                    <select
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        required
                                        disabled={!role}
                                        className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white appearance-none cursor-pointer w-full disabled:opacity-50"
                                    >
                                        <option value="" disabled className="bg-[#0f1f38]">
                                            {!role ? "Select Role First" : "Select Username"}
                                        </option>
                                        {getUsernameOptions().map((opt) => (
                                            <option key={opt} value={opt} className="bg-[#0f1f38]">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>"""

content = content.replace(field_str, username_select)

with open("client/src/StaffLogin.jsx", "w") as f:
    f.write(content)
