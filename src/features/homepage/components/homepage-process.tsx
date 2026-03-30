const steps = [
  {
    num: "1",
    title: "Создайте запрос",
    desc: "Укажите направление, даты, бюджет и размер группы",
  },
  {
    num: "2",
    title: "Другие присоединяются",
    desc: "Путешественники с похожими планами вступают в вашу группу",
  },
  {
    num: "3",
    title: "Гиды предлагают цену",
    desc: "Проводники видят запрос и присылают структурированные офферы",
  },
  {
    num: "4",
    title: "Договоритесь об условиях",
    desc: "Выберите оффер, обсудите детали, подтвердите бронирование",
  },
  {
    num: "5",
    title: "Отправляйтесь в путь",
    desc: "Маршрут подтверждён, группа собрана, гид готов",
  },
] as const;

export function HomePageProcess() {
  return (
    <section id="hiw" className="section low" aria-labelledby="hiw-title">
      <div className="container">
        <div className="hiw-header">
          <p className="sec-label">Как это работает</p>
          <h2 id="hiw-title" className="sec-title">
            Пять шагов от запроса до маршрута
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
