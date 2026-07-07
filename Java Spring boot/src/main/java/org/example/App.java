package org.example;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args )
    {
        ApplicationContext  context = new ClassPathXmlApplicationContext("SpringConfig.xml");
        Teacher t = (Teacher) context.getBean("t1");
        t.setName("dhineshKumar");
        t.setAge(20);
        t.setRno(8301);
        System.out.println(t.toString());
    }
}
