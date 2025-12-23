
import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import events from "../lib/constants";
function page() {
  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br/> which you cant miss</h1>
      <p className="text-center mt-5"> Hackathons, Meetups, and Conferences, All in One Place</p>
    <ExploreBtn />
    <div className="mt-20 space-y-7">
      <h3>Featured Events</h3>
      <ul className="events">
        {events.map((event)=>(
          <li key={event.title} >
            <EventCard title={event.title} image={event.image} slug={event.slug} location={event.location} date={event.date} time={event.time}/>
          </li>
        ))}

      </ul>

    </div>
    </section>

  )
}

export default page