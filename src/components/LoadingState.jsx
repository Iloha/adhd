function LoadingState({ label = "Loading tasks..." }) {
  return (
    <div role="status" className="min-h-screen flex items-center justify-center text-gray-500 text-xl">
      {label}
    </div>
  )
}

export default LoadingState
