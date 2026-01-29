function Header({name, date}) {
  
  return (
    <div className="header">
        <h1 className="title-h1">Календарь {name}</h1>
        <h2 className="title-h2">План на день</h2>
        <h3 className="title-h3">Today is {date}</h3>
    </div>
  )
}

export default Header
