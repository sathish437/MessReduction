package org.example;

public class student {
    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        System.out.println("someone tries to change the value ");

        if(age>0)
        {
            this.age = age;
        }
        else{
            System.out.println("poda jobdi ");
        }
    }

    private int age;
    void show()
    {
        System.out.println(" students mark is showing");
    }
    public student(){
        System.out.println("chikko");
    }

}
