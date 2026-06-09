import { motion } from "framer-motion"
import { FiUser, FiLock } from "react-icons/fi"
import logo from "./assets/1000088399.png"

const text = "LOGIN"

const getFourSideTransform = () => {
  const sides = ['top', 'bottom', 'left', 'right'];
  const side = sides[Math.floor(Math.random() * sides.length)];
  const distance = 350; 
  const variation = Math.floor(Math.random() * 100) - 50; 
  const randomRotate = Math.floor(Math.random() * 360) - 180;

  let initialX = 0;
  let initialY = 0;

  switch (side) {
    case 'top': initialX = variation; initialY = -distance; break;
    case 'bottom': initialX = variation; initialY = distance; break;
    case 'left': initialX = -distance; initialY = variation; break;
    case 'right': initialX = distance; initialY = variation; break;
  }

  return { x: initialX, y: initialY, rotate: randomRotate, opacity: 0, scale: 0.5, filter: "blur(12px)" };
}

function AnimatedTitle() {
  return (
    <div className="mb-10 flex flex-col items-center">
      <motion.h1
        className="font-black text-3xl sm:text-4xl text-teal-400 tracking-[0.2em] drop-shadow-lg"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
        }}
      >
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            className="inline-block cursor-default"
            variants={{
              hidden: getFourSideTransform(),
              visible: { 
                opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)", 
                transition: { type: "spring", stiffness: 150, damping: 18 } 
              },
            }}
            whileHover={{ scale: 1.2, color: "#2dd4bf", textShadow: "0px 0px 10px rgba(45,212,191,0.8)" }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h1>
    </div>
  )
}

function Login() {
  const inputContainerClass = "flex items-center border-b-2 border-teal-700/50 py-3 focus-within:border-teal-400 transition-colors duration-300"
  const inputClass = "w-full bg-transparent focus:outline-none text-base text-teal-50 placeholder:text-teal-200/40 ml-3"
  const iconClass = "text-teal-400 text-lg"

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-950 p-4">
      
      <div className="flex  gap-3 mb-6 ">
        <img src={logo} alt="logo" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />
        <h1 className="text-teal-50 text-sm sm:text-xl lg:text-5xl text-center  ">
          GOVERNMENT COLLEGE OF ENGINEERING, SRIRANGAM
        </h1>
      </div>

      <div className="w-full max-w-[340px] sm:max-w-md border border-teal-400/40 bg-teal-950/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-teal-500/20">
        
        <AnimatedTitle />

        <div className="flex flex-col gap-6 sm:gap-8">
          <div className={inputContainerClass}>
            <FiUser className={iconClass} />
            <input className={inputClass} placeholder="Username" type="text" />
          </div>

          <div className={inputContainerClass}>
            <FiLock className={iconClass} />
            <input className={inputClass} placeholder="Password" type="password" />
          </div>
          
          <div className="w-full flex justify-center mt-6">
            <button className="w-full sm:w-44 rounded-xl py-3 text-base font-bold text-slate-900 bg-teal-500 hover:bg-teal-400 shadow-lg transition-all duration-300 active:scale-95 tracking-wider">
              LOGIN
            </button>
          </div>

         
        </div>
      </div>
    </div>
  )
}

export default Login