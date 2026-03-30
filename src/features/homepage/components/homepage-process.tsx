const steps = [
  {
    num: "1",
    title: "Создайте запрос",
    desc: "Укажите направление, даты, бюджет и размер группы",
  },
  {
    num: "2",
    title: "Получите офферы от гидов",
    desc: "Проводники видят ваш запрос и присылают персональные предложения",
  },
  {
    num: "3",
    title: "Отправляйтесь в путь",
    desc: "Выберите гида, подтвердите бронирование, встречайтесь в точке старта",
  },
] as const;

export function HomePageProcess() {
  return (
    <section id="hiw" className="section low" aria-labelledby="hiw-title">
      <div className="container">
        <div className="hiw-header">
          <p className="sec-label">Как это работает</p>
          <h2 id="hiw-title" className="sec-title">
            Три шага от идеи до поездки
          </h2>
        </div>

        <div className="hiw-row">
          {steps.map((step, index) => (
            <div key={step.num} className="hiw-item">
              <article className="hiw-step">
                <div aria-hidden="true" className="hiw-num">
                  {step.num}
                </div>
                <h3 className="hiw-title">{step.title}</h3>
                <p className="hiw-desc">{step.desc}</p>
              </article>
              {index < steps.length - 1 ? <div aria-hidden="true" className="hiw-connector" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
