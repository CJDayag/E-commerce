import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AboutUs() {
  usePageTitle('About Us');
  const teamMembers = [
    {
      name: "John Doe",
      role: "CEO",
      image: "/team/john.jpg",
    },
    {
      name: "Jane Smith",
      role: "CTO",
      image: "/team/jane.jpg",
    },
    // Add more team members as needed
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About Our Company</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We are dedicated to providing the best e-commerce experience for our customers
          through innovation and exceptional service.
        </p>
      </div>

      <Card className="mb-16">
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To revolutionize the online shopping experience by delivering high-quality
            products, outstanding customer service, and innovative solutions that make
            shopping easier and more enjoyable for everyone.
          </p>
        </CardContent>
      </Card>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.name}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-muted-foreground">{member.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why Choose Us</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Quality Products</h3>
              <p className="text-muted-foreground">
                We carefully curate our product selection to ensure the highest quality
                for our customers.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Customer Support</h3>
              <p className="text-muted-foreground">
                Our dedicated support team is available 24/7 to assist you with any
                questions or concerns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
